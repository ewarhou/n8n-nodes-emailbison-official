import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeCampaignOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		// Create campaign
		const name = this.getNodeParameter('name', index) as string;
		const subject = this.getNodeParameter('subject', index) as string;
		const emailContent = this.getNodeParameter('emailContent', index) as string;
		const fromName = this.getNodeParameter('fromName', index, '') as string;
		const replyTo = this.getNodeParameter('replyTo', index, '') as string;
		const scheduleType = this.getNodeParameter('scheduleType', index, 'now') as string;
		const scheduledDate = this.getNodeParameter('scheduledDate', index, '') as string;

		// Validate required fields
		if (!name || name.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide a campaign name');
		}
		if (!subject || subject.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide an email subject');
		}
		if (!emailContent || emailContent.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide email content');
		}

		// Handle sender emails as array (multiOptions) or string (for backward compatibility)
		const senderEmailsParam = this.getNodeParameter('senderEmails', index, []) as string[] | string;
		let senderEmails: string[] = [];

		if (Array.isArray(senderEmailsParam)) {
			// New multiOptions format - array of sender email IDs
			senderEmails = senderEmailsParam;
		} else if (typeof senderEmailsParam === 'string' && senderEmailsParam.trim() !== '') {
			// Backward compatibility - comma-separated string
			senderEmails = senderEmailsParam.split(',').map((id: string) => id.trim());
		}

		// Validate sender emails
		if (senderEmails.length === 0) {
			throw new NodeOperationError(this.getNode(), 'Please select at least one sender email account');
		}

		// Handle tags as array (multiOptions) or string (for backward compatibility)
		const tagsParam = this.getNodeParameter('tags', index, []) as string[] | string;
		let tags: string[] = [];

		if (Array.isArray(tagsParam)) {
			// New multiOptions format - array of tag IDs
			tags = tagsParam;
		} else if (typeof tagsParam === 'string' && tagsParam.trim() !== '') {
			// Backward compatibility - comma-separated string
			tags = tagsParam.split(',').map((tag: string) => tag.trim());
		}

		const body: IDataObject = {
			name,
		};

		if (fromName) body.from_name = fromName;
		if (replyTo) body.reply_to = replyTo;
		if (scheduleType === 'scheduled' && scheduledDate) {
			body.scheduled_at = scheduledDate;
		}
		if (tags.length > 0) {
			body.tags = tags;
		}

		// Step 1: Create the campaign
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/campaigns',
				body,
			},
		);

		const campaign = responseData.data || responseData;
		const campaignId = campaign.id;

		// Step 2: Attach sender emails to the campaign (if any were provided)
		if (senderEmails.length > 0 && campaignId) {
			try {
				await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'POST',
						baseURL: `${credentials.serverUrl}/api`,
						url: `/campaigns/${campaignId}/attach-sender-emails`,
						body: {
							sender_email_ids: senderEmails,
						},
					},
				);
			} catch (error) {
				// Don't throw - campaign was created successfully
			}
		}

		// Step 3: Create the first sequence step with subject and email content
		if (campaignId && subject && emailContent) {
			try {
				const sequenceStepBody = {
					title: `${name} sequence`,
					sequence_steps: [
						{
							email_subject: subject,
							email_body: emailContent,
							order: 1,
							wait_in_days: 1,
							variant: false,
							thread_reply: false,
						},
					],
				};

				await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'POST',
						baseURL: `${credentials.serverUrl}/api`,
						url: `/campaigns/v1.1/${campaignId}/sequence-steps`,
						body: sequenceStepBody,
					},
				);
			} catch (error) {
				// Don't throw - campaign was created successfully
			}
		}

		return [{ json: campaign, pairedItem: { item: index } }];
	}

	if (operation === 'get') {
		// Get campaign by ID
		const campaignId = this.getNodeParameter('campaignId', index) as string;

		// Validate required field
		if (!campaignId || campaignId.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please select a campaign');
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/${campaignId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		// Get multiple campaigns
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const filters = this.getNodeParameter('filters', index, {}) as IDataObject;

		const qs: IDataObject = {};

		// Add filters to query string
		if (filters.status) qs.status = filters.status;
		if (filters.tag) qs.tag = filters.tag;

		if (returnAll) {
			// Paginate through all pages until an empty page is returned
			const allCampaigns: IDataObject[] = [];
			let page = 1;
			const MAX_PAGES = 1000;

			while (page <= MAX_PAGES) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/campaigns',
						qs: { ...qs, page },
					},
				);

				const pageCampaigns: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageCampaigns) || pageCampaigns.length === 0) break;

				allCampaigns.push(...pageCampaigns);

				const totalFromMeta = responseData.meta?.total as number | undefined;
				if (totalFromMeta !== undefined && allCampaigns.length >= totalFromMeta) break;

				page++;
			}

			return allCampaigns.map((campaign: IDataObject) => ({ json: campaign, pairedItem: { item: index } }));
		} else {
			const limit = this.getNodeParameter('limit', index, 50) as number;
			const collectedCampaigns: IDataObject[] = [];
			let page = 1;

			while (collectedCampaigns.length < limit) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/campaigns',
						qs: { ...qs, page },
					},
				);

				const pageCampaigns: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageCampaigns) || pageCampaigns.length === 0) break;

				collectedCampaigns.push(...pageCampaigns);
				page++;
			}

			return collectedCampaigns.slice(0, limit).map((campaign: IDataObject) => ({ json: campaign, pairedItem: { item: index } }));
		}
	}

	if (operation === 'update') {
		// Update campaign
		const campaignId = this.getNodeParameter('campaignId', index) as string;

		// Validate required field
		if (!campaignId || campaignId.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please select a campaign to update');
		}

		const name = this.getNodeParameter('name', index, '') as string;
		const fromName = this.getNodeParameter('fromName', index, '') as string;
		const replyTo = this.getNodeParameter('replyTo', index, '') as string;
		const scheduleType = this.getNodeParameter('scheduleType', index, 'now') as string;
		const scheduledDate = this.getNodeParameter('scheduledDate', index, '') as string;

		// Handle sender emails as array (multiOptions) or string (for backward compatibility)
		const senderEmailsParam = this.getNodeParameter('senderEmails', index, []) as string[] | string;
		let senderEmails: string[] = [];

		if (Array.isArray(senderEmailsParam)) {
			// New multiOptions format - array of sender email IDs
			senderEmails = senderEmailsParam;
		} else if (typeof senderEmailsParam === 'string' && senderEmailsParam.trim() !== '') {
			// Backward compatibility - comma-separated string
			senderEmails = senderEmailsParam.split(',').map((id: string) => id.trim());
		}

		// Handle tags as array (multiOptions) or string (for backward compatibility)
		const tagsParam = this.getNodeParameter('tags', index, []) as string[] | string;
		let tags: string[] = [];

		if (Array.isArray(tagsParam)) {
			// New multiOptions format - array of tag IDs
			tags = tagsParam;
		} else if (typeof tagsParam === 'string' && tagsParam.trim() !== '') {
			// Backward compatibility - comma-separated string
			tags = tagsParam.split(',').map((tag: string) => tag.trim());
		}

		const body: IDataObject = {};

		// Only include fields that are actually set (campaigns only support: name, from_name, reply_to, scheduled_at, tags)
		// Note: subject and email_content belong to sequence steps, not campaigns
		if (name) body.name = name;
		if (fromName) body.from_name = fromName;
		if (replyTo) body.reply_to = replyTo;
		if (scheduleType === 'scheduled' && scheduledDate) {
			body.scheduled_at = scheduledDate;
		}
		if (tags.length > 0) {
			body.tags = tags;
		}


		// Step 1: Update the campaign
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PATCH',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/${campaignId}/update`,
				body,
			},
		);


		// Step 2: Attach sender emails to the campaign (if any were provided)
		if (senderEmails.length > 0) {
			try {
				await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'POST',
						baseURL: `${credentials.serverUrl}/api`,
						url: `/campaigns/${campaignId}/attach-sender-emails`,
						body: {
							sender_email_ids: senderEmails,
						},
					},
				);
			} catch (error) {
				// Don't throw - campaign was updated successfully
			}
		}

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'resume') {
		// Start/Resume campaign
		const campaignId = this.getNodeParameter('campaignId', index) as string;


		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PATCH',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/${campaignId}/resume`,
			},
		);


		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'pause') {
		// Stop/Pause campaign
		const campaignId = this.getNodeParameter('campaignId', index) as string;


		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PATCH',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/${campaignId}/pause`,
			},
		);


		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'addLeads') {
		// Add leads to campaign
		const campaignId = this.getNodeParameter('campaignId', index) as string;
		const leadIdsInput = this.getNodeParameter('leadIds', index) as string | string[] | number | number[];

		// Handle different input types: string, array, or single number
		let leadIdsArray: number[] = [];

		if (typeof leadIdsInput === 'string') {
			// Comma-separated string: "33500,33501,33502"
			leadIdsArray = leadIdsInput.split(',').map((id: string) => parseInt(id.trim(), 10));
		} else if (Array.isArray(leadIdsInput)) {
			// Array of strings or numbers: [33500, 33501] or ["33500", "33501"]
			leadIdsArray = leadIdsInput.map((id: string | number) =>
				typeof id === 'number' ? id : parseInt(id.toString().trim(), 10)
			);
		} else if (typeof leadIdsInput === 'number') {
			// Single number: 33500
			leadIdsArray = [leadIdsInput];
		} else {
			throw new NodeOperationError(this.getNode(), 'Lead IDs must be provided as a comma-separated string, array, or single number');
		}

		// Filter out any NaN values
		leadIdsArray = leadIdsArray.filter((id) => !isNaN(id));

		if (leadIdsArray.length === 0) {
			throw new NodeOperationError(this.getNode(), 'No valid lead IDs provided');
		}


		const body: IDataObject = {
			lead_ids: leadIdsArray,
		};

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/${campaignId}/leads/attach-leads`,
				body,
			},
		);


		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		// Delete a single campaign
		const campaignId = this.getNodeParameter('campaignId', index) as string;

		if (!campaignId || campaignId.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please select a campaign to delete');
		}

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/${campaignId}`,
			},
		);

		return [{ json: { success: true, deleted: true, id: campaignId }, pairedItem: { item: index } }];
	}

	if (operation === 'deleteMany') {
		// Delete multiple campaigns (bulk delete)
		const campaignIdsInput = this.getNodeParameter('campaignIds', index) as string | number | number[];

		// Handle different input types: string, number, or array
		let campaignIds: number[] = [];

		if (typeof campaignIdsInput === 'number') {
			// Single number from expression like {{ $json.id }}
			campaignIds = [campaignIdsInput];
		} else if (Array.isArray(campaignIdsInput)) {
			// Array of numbers/strings
			campaignIds = campaignIdsInput.map((id) => typeof id === 'number' ? id : parseInt(String(id).trim(), 10));
		} else if (typeof campaignIdsInput === 'string') {
			// Comma-separated string: "123,456,789"
			campaignIds = campaignIdsInput
				.split(',')
				.map((id: string) => parseInt(id.trim(), 10));
		}

		// Filter out any NaN values
		campaignIds = campaignIds.filter((id: number) => !isNaN(id));

		if (campaignIds.length === 0) {
			throw new NodeOperationError(this.getNode(), 'No valid campaign IDs provided. Please provide comma-separated numeric IDs, a single ID, or an array of IDs.');
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/campaigns/bulk',
				body: {
					campaign_ids: campaignIds,
				},
			},
		);

		return [{ json: { success: true, deleted: true, count: campaignIds.length, campaign_ids: campaignIds, response: responseData }, pairedItem: { item: index } }];
	}

	if (operation === 'addSequenceStep') {
		// Add a sequence step to an existing campaign
		const campaignId = this.getNodeParameter('campaignId', index) as string;
		const emailSubject = this.getNodeParameter('emailSubject', index) as string;
		const emailBody = this.getNodeParameter('emailBody', index) as string;
		const stepOrder = this.getNodeParameter('stepOrder', index) as number;
		const waitDays = this.getNodeParameter('waitDays', index) as number;

		const additionalFields = this.getNodeParameter('additionalFields', index, {}) as IDataObject;
		const sequenceTitle = additionalFields.sequenceTitle as string || '';
		const variant = additionalFields.variant as boolean || false;
		const threadReply = additionalFields.threadReply as boolean || false;

		// Get campaign name for default sequence title if not provided
		let title = sequenceTitle;
		if (!title) {
			try {
				const campaignData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: `/campaigns/${campaignId}`,
					},
				);
				const campaign = campaignData.data || campaignData;
				title = `${campaign.name} sequence`;
			} catch (error) {
				// If we can't get the campaign name, use a generic title
				title = 'Campaign sequence';
			}
		}

		const body = {
			title,
			sequence_steps: [
				{
					email_subject: emailSubject,
					email_body: emailBody,
					order: stepOrder,
					wait_in_days: waitDays,
					variant,
					thread_reply: threadReply,
				},
			],
		};

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/v1.1/${campaignId}/sequence-steps`,
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for campaigns!`);
}
