import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeWebhookOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		const url = this.getNodeParameter('url', index) as string;
		const events = this.getNodeParameter('events', index) as string[];
		const name = this.getNodeParameter('name', index, '') as string;
		const secret = this.getNodeParameter('secret', index, '') as string;

		const body: IDataObject = {
			url,
			events,
		};

		if (name) body.name = name;
		if (secret) body.secret = secret;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/webhooks',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'get') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/webhooks/${webhookId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'update') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;
		const events = this.getNodeParameter('events', index, []) as string[];
		const name = this.getNodeParameter('name', index, '') as string;
		const secret = this.getNodeParameter('secret', index, '') as string;

		const body: IDataObject = {};

		if (events.length > 0) body.events = events;
		if (name) body.name = name;
		if (secret) body.secret = secret;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PUT',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/webhooks/${webhookId}`,
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		const webhookId = this.getNodeParameter('webhookId', index) as string;

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/webhooks/${webhookId}`,
			},
		);

		return [{ json: { success: true, id: webhookId }, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for webhooks!`);
}
