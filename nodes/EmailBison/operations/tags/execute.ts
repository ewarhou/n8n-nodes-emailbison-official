import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeTagOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		const name = this.getNodeParameter('name', index) as string;
		const defaultTag = this.getNodeParameter('default', index, false) as boolean;

		const body: IDataObject = { name };
		if (defaultTag !== undefined && defaultTag !== null) {
			body.default = defaultTag;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const qs: IDataObject = {};

		if (returnAll) {
			// Paginate through all pages until an empty page is returned
			const allTags: IDataObject[] = [];
			let page = 1;
			const MAX_PAGES = 1000;

			while (page <= MAX_PAGES) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/tags',
						qs: { ...qs, page },
					},
				);

				const pageTags: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageTags) || pageTags.length === 0) break;

				allTags.push(...pageTags);

				const totalFromMeta = responseData.meta?.total as number | undefined;
				if (totalFromMeta !== undefined && allTags.length >= totalFromMeta) break;

				page++;
			}

			return allTags.map((tag: IDataObject) => ({ json: tag, pairedItem: { item: index } }));
		} else {
			const limit = this.getNodeParameter('limit', index, 50) as number;
			qs.limit = limit;

			const responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'emailBisonAmineApi',
				{
					method: 'GET',
					baseURL: `${credentials.serverUrl}/api`,
					url: '/tags',
					qs,
				},
			);

			const tags: IDataObject[] = responseData.data || responseData;
			return tags.map((tag: IDataObject) => ({ json: tag, pairedItem: { item: index } }));
		}
	}

	if (operation === 'delete') {
		const tagId = this.getNodeParameter('tagId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/tags/${tagId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'attachToLeads') {
		const tagIds = this.getNodeParameter('tagIds', index) as string[];
		const leadIdsInput = this.getNodeParameter('leadIds', index) as string | string[] | number;
		const skipWebhooks = this.getNodeParameter('skipWebhooks', index, false) as boolean;

		// Parse lead IDs - handle string, array, or number input
		let leadIdsArray: number[] = [];
		if (typeof leadIdsInput === 'string') {
			// Comma-separated string: "33500,33501,33502"
			leadIdsArray = leadIdsInput.split(',').map((id) => parseInt(id.trim(), 10));
		} else if (Array.isArray(leadIdsInput)) {
			// Array of strings or numbers: [33500, 33501] or ["33500", "33501"]
			leadIdsArray = leadIdsInput.map((id: string | number) =>
				typeof id === 'number' ? id : parseInt(id.toString().trim(), 10)
			);
		} else if (typeof leadIdsInput === 'number') {
			// Single number: 33500
			leadIdsArray = [leadIdsInput];
		} else {
			throw new NodeOperationError(this.getNode(),'Lead IDs must be provided as a comma-separated string, array, or single number');
		}

		const body: IDataObject = {
			lead_ids: leadIdsArray,
			tag_ids: tagIds.map((id) => parseInt(id, 10)),
		};

		if (skipWebhooks) {
			body.skip_webhooks = true;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags/attach-to-leads',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'removeFromLeads') {
		const tagIds = this.getNodeParameter('tagIds', index) as string[];
		const leadIdsInput = this.getNodeParameter('leadIds', index) as string | string[] | number;
		const skipWebhooks = this.getNodeParameter('skipWebhooks', index, false) as boolean;

		// Parse lead IDs - handle string, array, or number input
		let leadIdsArray: number[] = [];
		if (typeof leadIdsInput === 'string') {
			// Comma-separated string: "33500,33501,33502"
			leadIdsArray = leadIdsInput.split(',').map((id) => parseInt(id.trim(), 10));
		} else if (Array.isArray(leadIdsInput)) {
			// Array of strings or numbers: [33500, 33501] or ["33500", "33501"]
			leadIdsArray = leadIdsInput.map((id: string | number) =>
				typeof id === 'number' ? id : parseInt(id.toString().trim(), 10)
			);
		} else if (typeof leadIdsInput === 'number') {
			// Single number: 33500
			leadIdsArray = [leadIdsInput];
		} else {
			throw new NodeOperationError(this.getNode(),'Lead IDs must be provided as a comma-separated string, array, or single number');
		}

		const body: IDataObject = {
			lead_ids: leadIdsArray,
			tag_ids: tagIds.map((id) => parseInt(id, 10)),
		};

		if (skipWebhooks) {
			body.skip_webhooks = true;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags/remove-from-leads',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'attachToCampaigns') {
		const tagIds = this.getNodeParameter('tagIds', index) as string[];
		const campaignIds = this.getNodeParameter('campaignIds', index) as string;
		const skipWebhooks = this.getNodeParameter('skipWebhooks', index, false) as boolean;

		// Parse campaign IDs (comma-separated string to array of integers)
		const campaignIdsArray = campaignIds.split(',').map((id) => parseInt(id.trim(), 10));

		const body: IDataObject = {
			campaign_ids: campaignIdsArray,
			tag_ids: tagIds.map((id) => parseInt(id, 10)),
		};

		if (skipWebhooks) {
			body.skip_webhooks = true;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags/attach-to-campaigns',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'removeFromCampaigns') {
		const tagIds = this.getNodeParameter('tagIds', index) as string[];
		const campaignIds = this.getNodeParameter('campaignIds', index) as string;
		const skipWebhooks = this.getNodeParameter('skipWebhooks', index, false) as boolean;

		// Parse campaign IDs (comma-separated string to array of integers)
		const campaignIdsArray = campaignIds.split(',').map((id) => parseInt(id.trim(), 10));

		const body: IDataObject = {
			campaign_ids: campaignIdsArray,
			tag_ids: tagIds.map((id) => parseInt(id, 10)),
		};

		if (skipWebhooks) {
			body.skip_webhooks = true;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags/remove-from-campaigns',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'attachToEmailAccounts') {
		const tagIds = this.getNodeParameter('tagIds', index) as string[];
		const emailAccountIds = this.getNodeParameter('emailAccountIds', index) as string;
		const skipWebhooks = this.getNodeParameter('skipWebhooks', index, false) as boolean;

		// Parse email account IDs (comma-separated string to array of integers)
		const emailAccountIdsArray = emailAccountIds.split(',').map((id) => parseInt(id.trim(), 10));

		const body: IDataObject = {
			sender_email_ids: emailAccountIdsArray,
			tag_ids: tagIds.map((id) => parseInt(id, 10)),
		};

		if (skipWebhooks) {
			body.skip_webhooks = true;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags/attach-to-sender-emails',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'removeFromEmailAccounts') {
		const tagIds = this.getNodeParameter('tagIds', index) as string[];
		const emailAccountIds = this.getNodeParameter('emailAccountIds', index) as string;
		const skipWebhooks = this.getNodeParameter('skipWebhooks', index, false) as boolean;

		// Parse email account IDs (comma-separated string to array of integers)
		const emailAccountIdsArray = emailAccountIds.split(',').map((id) => parseInt(id.trim(), 10));

		const body: IDataObject = {
			sender_email_ids: emailAccountIdsArray,
			tag_ids: tagIds.map((id) => parseInt(id, 10)),
		};

		if (skipWebhooks) {
			body.skip_webhooks = true;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/tags/remove-from-sender-emails',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(),`The operation "${operation}" is not supported for tags!`);
}
