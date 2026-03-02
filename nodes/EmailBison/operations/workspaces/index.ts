import { INodeProperties } from 'n8n-workflow';

export const workspaceOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
			},
		},
		options: [
			{
				name: 'Accept Invitation',
				value: 'acceptInvitation',
				description: 'Accept a workspace invitation',
				action: 'Accept invitation',
			},
			{
				name: 'Create',
				value: 'create',
				description: 'Create a new workspace',
				action: 'Create workspace',
			},
			{
				name: 'Create API Token',
				value: 'createApiToken',
				description: 'Create an API token for a workspace',
				action: 'Create API token',
			},
			{
				name: 'Create User',
				value: 'createUser',
				description: 'Create a new user in the workspace',
				action: 'Create user',
			},
			{
				name: 'Delete',
				value: 'delete',
				description: 'Delete a workspace',
				action: 'Delete workspace',
			},
			{
				name: 'Delete Member',
				value: 'deleteMember',
				description: 'Delete a member from the workspace',
				action: 'Delete member',
			},
			{
				name: 'Get',
				value: 'get',
				description: 'Get workspace information',
				action: 'Get workspace',
			},
			{
				name: 'Get Line Area Chart Stats',
				value: 'getLineAreaChartStats',
				description: 'Get line/area chart statistics',
				action: 'Get line area chart stats',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get multiple workspaces',
				action: 'Get many workspaces',
			},
			{
				name: 'Get Master Inbox Settings',
				value: 'getMasterInboxSettings',
				description: 'Get master inbox settings',
				action: 'Get master inbox settings',
			},
			{
				name: 'Get Stats',
				value: 'getStats',
				description: 'Get workspace statistics',
				action: 'Get stats',
			},
			{
				name: 'Invite Members',
				value: 'inviteMembers',
				description: 'Invite members to the workspace',
				action: 'Invite members',
			},
			{
				name: 'Switch Workspace',
				value: 'switchWorkspace',
				description: 'Switch to a different workspace',
				action: 'Switch workspace',
			},
			{
				name: 'Update',
				value: 'update',
				description: 'Update workspace settings',
				action: 'Update workspace',
			},
			{
				name: 'Update Master Inbox Settings',
				value: 'updateMasterInboxSettings',
				description: 'Update master inbox settings',
				action: 'Update master inbox settings',
			},
		],
		default: 'get',
	},
];

export const workspaceFields: INodeProperties[] = [
	// Get/Update/Delete operation fields
	{
		displayName: 'Workspace',
		name: 'teamId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getWorkspaces',
		},
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['get', 'update', 'delete', 'createApiToken'],
			},
		},
		default: '',
		description: 'The workspace to work with. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},

	// Create operation fields
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['create'],
			},
		},
		default: '',
		description: 'Name of the workspace',
	},

	// Update operation fields
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['update'],
			},
		},
		default: '',
		description: 'Name of the workspace',
	},

	// Get Many operation fields
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['getMany'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		default: 50,
		description: 'Max number of results to return',
	},

	// Create User operation fields
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['createUser'],
			},
		},
		default: '',
		description: 'Email address of the user',
	},
	{
		displayName: 'First Name',
		name: 'firstName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['createUser'],
			},
		},
		default: '',
		description: 'First name of the user',
	},
	{
		displayName: 'Last Name',
		name: 'lastName',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['createUser'],
			},
		},
		default: '',
		description: 'Last name of the user',
	},

	// Create API Token operation fields
	{
		displayName: 'Name',
		name: 'name',
		type: 'string',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['createApiToken'],
			},
		},
		default: '',
		description: 'Name of the API token',
	},

	// Switch Workspace operation fields
	{
		displayName: 'Workspace',
		name: 'teamId',
		type: 'options',
		typeOptions: {
			loadOptionsMethod: 'getWorkspaces',
		},
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['switchWorkspace'],
			},
		},
		default: '',
		description: 'The workspace to switch to. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
	},

	// Invite Members operation fields
	{
		displayName: 'Email',
		name: 'email',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['inviteMembers'],
			},
		},
		default: '',
		description: 'Email address of the member to invite',
	},
	{
		displayName: 'Role',
		name: 'role',
		type: 'options',
		options: [
			{ name: 'Admin', value: 'admin' },
			{ name: 'Editor', value: 'editor' },
			{ name: 'Client', value: 'client' },
			{ name: 'Reseller', value: 'reseller' },
		],
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['inviteMembers'],
			},
		},
		default: 'admin',
		description: 'Role of the member',
	},

	// Accept Invitation operation fields
	{
		displayName: 'Team Invitation ID',
		name: 'teamInvitationId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['acceptInvitation'],
			},
		},
		default: '',
		description: 'ID of the team invitation',
	},

	// Delete Member operation fields
	{
		displayName: 'User ID',
		name: 'userId',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['deleteMember'],
			},
		},
		default: '',
		description: 'ID of the user to delete',
	},

	// Update Master Inbox Settings operation fields
	{
		displayName: 'Settings',
		name: 'settings',
		type: 'json',
		displayOptions: {
			show: {
				resource: ['workspace'],
				operation: ['updateMasterInboxSettings'],
			},
		},
		default: '{}',
		description: 'Master inbox settings as JSON object',
	},
];
