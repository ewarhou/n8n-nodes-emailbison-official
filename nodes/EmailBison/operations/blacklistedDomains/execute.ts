import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeBlacklistedDomainOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		// Add domain to blacklist
		const domain = this.getNodeParameter('domain', index) as string;

		if (!domain || domain.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide a domain to blacklist');
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/blacklisted-domains',
				body: {
					domain: domain.trim(),
				},
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		// Remove domain from blacklist
		const blacklistedDomainId = this.getNodeParameter('blacklistedDomainId', index) as string;

		if (!blacklistedDomainId || blacklistedDomainId.trim() === '') {
			throw new NodeOperationError(this.getNode(), 'Please provide the blacklisted domain ID to remove');
		}

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/blacklisted-domains/${blacklistedDomainId}`,
			},
		);

		return [{ json: { success: true, deleted: true, id: blacklistedDomainId }, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		// Get all blacklisted domains
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;

		const qs: IDataObject = {};

		if (!returnAll) {
			const limit = this.getNodeParameter('limit', index, 50) as number;
			qs.limit = limit;
		}

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/blacklisted-domains',
				qs,
			},
		);

		const blacklistedDomains = responseData.data || responseData;

		if (Array.isArray(blacklistedDomains)) {
			return blacklistedDomains.map((item: IDataObject) => ({ json: item, pairedItem: { item: index } }));
		}

		return [{ json: blacklistedDomains, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for blacklisted domains!`);
}
