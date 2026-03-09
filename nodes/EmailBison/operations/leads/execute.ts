import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeLeadOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		// Create lead
		const email = this.getNodeParameter('email', index) as string;
		const firstName = this.getNodeParameter('firstName', index, '') as string;
		const lastName = this.getNodeParameter('lastName', index, '') as string;
		const company = this.getNodeParameter('company', index, '') as string;
		const phone = this.getNodeParameter('phone', index, '') as string;
		const website = this.getNodeParameter('website', index, '') as string;
		const tags = this.getNodeParameter('tags', index, []) as string[] | string;
		const customFields = this.getNodeParameter('customFields', index, {}) as IDataObject;

		// Step 1: Create the lead with basic info (tags are NOT supported in create endpoint)
		const body: IDataObject = {
			email,
		};

		if (firstName) body.first_name = firstName;
		if (lastName) body.last_name = lastName;
		if (company) body.company = company;
		if (phone) body.phone = phone;
		if (website) body.website = website;

		// Handle custom fields
		if (customFields && customFields.field) {
			const fields = customFields.field as IDataObject[];
			const customFieldsObj: IDataObject = {};
			fields.forEach((field) => {
				if (field.key && field.value) {
					customFieldsObj[field.key as string] = field.value;
				}
			});
			if (Object.keys(customFieldsObj).length > 0) {
				body.custom_fields = customFieldsObj;
			}
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/leads',
				body,
			},
		);

		const leadData = responseData.data || responseData;
		const leadId = leadData.id;

		// Step 2: Attach tags if provided (tags must be attached separately)
		if (tags && tags.length > 0 && leadId) {
			// Convert tags to array of integers
			let tagIds: number[] = [];
			if (Array.isArray(tags)) {
				tagIds = tags.map((tag: string) => parseInt(tag, 10));
			} else {
				tagIds = tags.split(',').map((tag: string) => parseInt(tag.trim(), 10));
			}

			try {
				await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'POST',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/tags/attach-to-leads',
						body: {
							lead_ids: [leadId],
							tag_ids: tagIds,
						},
					},
				);
			} catch (_error) {
				// Don't throw - lead was created successfully, just tags failed
			}
		}

		return [{ json: leadData, pairedItem: { item: index } }];
	}

	if (operation === 'get') {
		// Get lead by ID
		const leadId = this.getNodeParameter('leadId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/leads/${leadId}`,
			},
		);

		return [{ json: responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		// Get multiple leads
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const search = this.getNodeParameter('search', index, '') as string;
		const filters = this.getNodeParameter('filters', index, {}) as IDataObject;

		const qs: IDataObject = {};

		// Add search parameter (top-level, not in filters)
		if (search) {
			qs.search = search;
		}

		// Add filter parameters according to API documentation
		// All filters are prefixed with 'filters.' in the query string
		if (filters.lead_campaign_status) {
			qs['filters.lead_campaign_status'] = filters.lead_campaign_status;
		}

		if (filters.verification_statuses && Array.isArray(filters.verification_statuses) && filters.verification_statuses.length > 0) {
			qs['filters.verification_statuses'] = filters.verification_statuses;
		}

		if (filters.tag_ids) {
			const tagIds = (filters.tag_ids as string).split(',').map((id) => id.trim()).filter((id) => id);
			if (tagIds.length > 0) {
				qs['filters.tag_ids'] = tagIds;
			}
		}

		if (filters.excluded_tag_ids) {
			const excludedTagIds = (filters.excluded_tag_ids as string).split(',').map((id) => id.trim()).filter((id) => id);
			if (excludedTagIds.length > 0) {
				qs['filters.excluded_tag_ids'] = excludedTagIds;
			}
		}

		if (filters.without_tags === true) {
			qs['filters.without_tags'] = true;
		}

		if (returnAll) {
			// Paginate through all pages until an empty page is returned
			const allLeads: IDataObject[] = [];
			let page = 1;
			const MAX_PAGES = 1000;

			while (page <= MAX_PAGES) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/leads',
						qs: { ...qs, page },
					},
				);

				const pageLeads: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageLeads) || pageLeads.length === 0) break;

				allLeads.push(...pageLeads);

				// If the page returned fewer items than a full page, we've reached the end
				const totalFromMeta = responseData.meta?.total as number | undefined;
				if (totalFromMeta !== undefined && allLeads.length >= totalFromMeta) break;

				page++;
			}

			return allLeads.map((lead: IDataObject) => ({ json: lead, pairedItem: { item: index } }));
		} else {
			const limit = this.getNodeParameter('limit', index, 50) as number;
			qs.limit = limit;

			const responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'emailBisonAmineApi',
				{
					method: 'GET',
					baseURL: `${credentials.serverUrl}/api`,
					url: '/leads',
					qs,
				},
			);

			const leads: IDataObject[] = responseData.data || responseData;
			return leads.map((lead: IDataObject) => ({ json: lead, pairedItem: { item: index } }));
		}
	}

	if (operation === 'update') {
		// Update lead
		const leadId = this.getNodeParameter('leadId', index) as string;
		const firstName = this.getNodeParameter('firstName', index, '') as string;
		const lastName = this.getNodeParameter('lastName', index, '') as string;
		const company = this.getNodeParameter('company', index, '') as string;
		const phone = this.getNodeParameter('phone', index, '') as string;
		const website = this.getNodeParameter('website', index, '') as string;
		const tags = this.getNodeParameter('tags', index, []) as string[] | string;
		const customFields = this.getNodeParameter('customFields', index, {}) as IDataObject;

		const body: IDataObject = {};

		if (firstName) body.first_name = firstName;
		if (lastName) body.last_name = lastName;
		if (company) body.company = company;
		if (phone) body.phone = phone;
		if (website) body.website = website;

		// Handle tags - support both array (from dropdown) and string (from expression)
		if (tags && tags.length > 0) {
			if (Array.isArray(tags)) {
				body.tags = tags;
			} else {
				body.tags = tags.split(',').map((tag: string) => tag.trim());
			}
		}

		// Handle custom fields
		if (customFields && customFields.field) {
			const fields = customFields.field as IDataObject[];
			const customFieldsObj: IDataObject = {};
			fields.forEach((field) => {
				if (field.key && field.value) {
					customFieldsObj[field.key as string] = field.value;
				}
			});
			if (Object.keys(customFieldsObj).length > 0) {
				body.custom_fields = customFieldsObj;
			}
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PATCH',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/leads/${leadId}`,
				body,
			},
		);

		return [{ json: responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		// Delete a single lead
		const leadId = this.getNodeParameter('leadId', index) as string;

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/leads/${leadId}`,
			},
		);

		return [{ json: { success: true, deleted: true, id: leadId }, pairedItem: { item: index } }];
	}

	if (operation === 'deleteMany') {
		// Delete multiple leads (bulk delete)
		const leadIdsInput = this.getNodeParameter('leadIds', index) as string | number | number[];

		// Handle different input types: string, number, or array
		let leadIds: number[] = [];

		if (typeof leadIdsInput === 'number') {
			// Single number from expression like {{ $json.id }}
			leadIds = [leadIdsInput];
		} else if (Array.isArray(leadIdsInput)) {
			// Array of numbers/strings
			leadIds = leadIdsInput.map((id) => typeof id === 'number' ? id : parseInt(String(id).trim(), 10));
		} else if (typeof leadIdsInput === 'string') {
			// Comma-separated string: "123,456,789"
			leadIds = leadIdsInput
				.split(',')
				.map((id: string) => parseInt(id.trim(), 10));
		}

		// Filter out any NaN values
		leadIds = leadIds.filter((id: number) => !isNaN(id));

		if (leadIds.length === 0) {
			throw new NodeOperationError(this.getNode(), 'No valid lead IDs provided. Please provide comma-separated numeric IDs, a single ID, or an array of IDs.');
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/leads/bulk',
				body: {
					lead_ids: leadIds,
				},
			},
		);

		return [{ json: { success: true, deleted: true, count: leadIds.length, lead_ids: leadIds, response: responseData }, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for leads!`);
}
