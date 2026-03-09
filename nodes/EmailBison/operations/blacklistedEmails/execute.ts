import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeBlacklistedEmailOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		// Add email to blacklist
		const email = this.getNodeParameter('email', index) as string;

		if (!email || email.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide an email address to blacklist');
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/blacklisted-emails',
				body: {
					email: email.trim(),
				},
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		// Remove email from blacklist
		const blacklistedEmailId = this.getNodeParameter('blacklistedEmailId', index) as string;

		if (!blacklistedEmailId || blacklistedEmailId.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide the blacklisted email ID to remove');
		}

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/blacklisted-emails/${blacklistedEmailId}`,
			},
		);

		return [{ json: { success: true, deleted: true, id: blacklistedEmailId }, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		// Get all blacklisted emails
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const qs: IDataObject = {};

		if (returnAll) {
			// Paginate through all pages until an empty page is returned
			const allEmails: IDataObject[] = [];
			let page = 1;
			const MAX_PAGES = 1000;

			while (page <= MAX_PAGES) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/blacklisted-emails',
						qs: { ...qs, page },
					},
				);

				const pageEmails: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageEmails) || pageEmails.length === 0) break;

				allEmails.push(...pageEmails);

				const totalFromMeta = responseData.meta?.total as number | undefined;
				if (totalFromMeta !== undefined && allEmails.length >= totalFromMeta) break;

				page++;
			}

			return allEmails.map((item: IDataObject) => ({ json: item, pairedItem: { item: index } }));
		} else {
			const limit = this.getNodeParameter('limit', index, 50) as number;
			qs.limit = limit;

			const responseData = await this.helpers.httpRequestWithAuthentication.call(
				this,
				'emailBisonAmineApi',
				{
					method: 'GET',
					baseURL: `${credentials.serverUrl}/api`,
					url: '/blacklisted-emails',
					qs,
				},
			);

			const blacklistedEmails = responseData.data || responseData;
			if (Array.isArray(blacklistedEmails)) {
				return blacklistedEmails.map((item: IDataObject) => ({ json: item, pairedItem: { item: index } }));
			}
			return [{ json: blacklistedEmails, pairedItem: { item: index } }];
		}
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for blacklisted emails!`);
}
