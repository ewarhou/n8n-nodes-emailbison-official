import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeWorkspaceOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'get') {
		const teamId = this.getNodeParameter('teamId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/workspaces/v1.1/${teamId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getMany') {
		const returnAll = this.getNodeParameter('returnAll', index, false) as boolean;
		const qs: IDataObject = {};

		if (returnAll) {
			// Paginate through all pages until an empty page is returned
			const allWorkspaces: IDataObject[] = [];
			let page = 1;
			const MAX_PAGES = 1000;

			while (page <= MAX_PAGES) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/workspaces/v1.1',
						qs: { ...qs, page },
					},
				);

				const pageWorkspaces: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageWorkspaces) || pageWorkspaces.length === 0) break;

				allWorkspaces.push(...pageWorkspaces);

				const totalFromMeta = responseData.meta?.total as number | undefined;
				if (totalFromMeta !== undefined && allWorkspaces.length >= totalFromMeta) break;

				page++;
			}

			return allWorkspaces.map((workspace: IDataObject) => ({ json: workspace, pairedItem: { item: index } }));
		} else {
			const limit = this.getNodeParameter('limit', index, 50) as number;
			const collectedWorkspaces: IDataObject[] = [];
			let page = 1;

			while (collectedWorkspaces.length < limit) {
				const responseData = await this.helpers.httpRequestWithAuthentication.call(
					this,
					'emailBisonAmineApi',
					{
						method: 'GET',
						baseURL: `${credentials.serverUrl}/api`,
						url: '/workspaces/v1.1',
						qs: { ...qs, page },
					},
				);

				const pageWorkspaces: IDataObject[] = responseData.data || responseData;
				if (!Array.isArray(pageWorkspaces) || pageWorkspaces.length === 0) break;

				collectedWorkspaces.push(...pageWorkspaces);
				page++;
			}

			return collectedWorkspaces.slice(0, limit).map((workspace: IDataObject) => ({ json: workspace, pairedItem: { item: index } }));
		}
	}

	if (operation === 'create') {
		const name = this.getNodeParameter('name', index) as string;

		const body: IDataObject = { name };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'update') {
		const teamId = this.getNodeParameter('teamId', index) as string;
		const name = this.getNodeParameter('name', index, '') as string;

		const body: IDataObject = {};
		if (name) body.name = name;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PUT',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/workspaces/v1.1/${teamId}`,
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		const teamId = this.getNodeParameter('teamId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/workspaces/v1.1/${teamId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'createUser') {
		const email = this.getNodeParameter('email', index) as string;
		const firstName = this.getNodeParameter('firstName', index, '') as string;
		const lastName = this.getNodeParameter('lastName', index, '') as string;

		const body: IDataObject = { email };
		if (firstName) body.first_name = firstName;
		if (lastName) body.last_name = lastName;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/users',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'createApiToken') {
		const teamId = this.getNodeParameter('teamId', index) as string;
		const name = this.getNodeParameter('name', index, '') as string;

		const body: IDataObject = {};
		if (name) body.name = name;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/workspaces/v1.1/${teamId}/api-tokens`,
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'switchWorkspace') {
		const teamId = this.getNodeParameter('teamId', index) as string;

		const body: IDataObject = { team_id: parseInt(teamId, 10) };

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/switch-workspace',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'inviteMembers') {
		const email = this.getNodeParameter('email', index) as string;
		const role = this.getNodeParameter('role', index, 'admin') as string;

		const body: IDataObject = {
			email,
			role,
		};

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/invite-members',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'acceptInvitation') {
		const teamInvitationId = this.getNodeParameter('teamInvitationId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/workspaces/v1.1/accept/${teamInvitationId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'deleteMember') {
		const userId = this.getNodeParameter('userId', index) as string;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/workspaces/v1.1/members/${userId}`,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getMasterInboxSettings') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/master-inbox-settings',
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'updateMasterInboxSettings') {
		const settings = this.getNodeParameter('settings', index, {}) as IDataObject;

		const body: IDataObject = settings;

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'PATCH',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/master-inbox-settings',
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getStats') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/stats',
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'getLineAreaChartStats') {
		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'GET',
				baseURL: `${credentials.serverUrl}/api`,
				url: '/workspaces/v1.1/line-area-chart-stats',
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `The operation "${operation}" is not supported for workspaces!`);
}
