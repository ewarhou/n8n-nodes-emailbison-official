import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeEmailAccountOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'create') {
		// Create email account
		const email = this.getNodeParameter('email', index) as string;
		const name = this.getNodeParameter('name', index) as string;
		const smtpHost = this.getNodeParameter('smtpHost', index) as string;
		const smtpPort = this.getNodeParameter('smtpPort', index) as number;
		const smtpUsername = this.getNodeParameter('smtpUsername', index) as string;
		const smtpPassword = this.getNodeParameter('smtpPassword', index) as string;
		const smtpSecurity = this.getNodeParameter('smtpSecurity', index, 'tls') as string;
		const dailySendLimit = this.getNodeParameter('dailySendLimit', index, 500) as number;

		const body: IDataObject = {
			email,
			name,
			smtp_host: smtpHost,
			smtp_port: smtpPort,
			smtp_username: smtpUsername,
			smtp_password: smtpPassword,
			smtp_security: smtpSecurity,
			daily_send_limit: dailySendLimit,
		};

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/sender-emails',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'get') {
		// Get email account by ID
		const emailAccountId = this.getNodeParameter('emailAccountId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/sender-emails/${emailAccountId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		// Get multiple email accounts
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
				url: '/sender-emails',
				qs,
			},
		);

		const emailAccounts = responseData.data || responseData;
		return emailAccounts.map((account: IDataObject) => ({ json: account, pairedItem: { item: index } }));
	}

	if (operation === 'update') {
		// Update email account
		const emailAccountId = this.getNodeParameter('emailAccountId', index) as string;
		const updateFields = this.getNodeParameter('updateFields', index, {}) as IDataObject;

		// First, get the current email account data
		const currentData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/sender-emails/${emailAccountId}`,
			},
		);

		// Extract current values from the response
		const current = currentData.data || currentData;

		// Build update body with current values as defaults, overridden by updateFields
		const body: IDataObject = {
			name: updateFields.name || current.name,
			smtp_host: updateFields.smtpHost || current.smtp_host,
			smtp_port: updateFields.smtpPort !== undefined ? updateFields.smtpPort : current.smtp_port,
			smtp_username: updateFields.smtpUsername || current.smtp_username,
			smtp_password: updateFields.smtpPassword || current.smtp_password,
			smtp_security: updateFields.smtpSecurity || current.smtp_security,
			daily_limit: updateFields.dailySendLimit !== undefined ? updateFields.dailySendLimit : current.daily_limit,
		};

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PATCH',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/sender-emails/${emailAccountId}`,
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		// Delete email account
		const emailAccountId = this.getNodeParameter('emailAccountId', index) as string;

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/sender-emails/${emailAccountId}`,
			},
		);

		return [{ json: { success: true, id: emailAccountId }, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for email accounts!`);
}
