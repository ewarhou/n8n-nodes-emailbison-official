import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	NodeOperationError,
} from 'n8n-workflow';

import { leadOperations, leadFields } from './operations/leads';
import { campaignOperations, campaignFields } from './operations/campaigns';
import { emailAccountOperations, emailAccountFields } from './operations/emailAccounts';
import { tagOperations, tagFields } from './operations/tags';
import { workspaceOperations, workspaceFields } from './operations/workspaces';
import { webhookOperations, webhookFields } from './operations/webhooks';
import { sequenceStepOperations, sequenceStepFields } from './operations/sequenceSteps';
import { replyOperations, replyFields } from './operations/replies';
import { blacklistedEmailOperations, blacklistedEmailFields } from './operations/blacklistedEmails';
import { blacklistedDomainOperations, blacklistedDomainFields } from './operations/blacklistedDomains';

export class EmailBisonAmine implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'EmailBison (Amine)',
		name: 'emailBisonAmine',
		icon: 'file:emailbison.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with EmailBison API',
		defaults: {
			name: 'EmailBison',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'emailBisonAmineApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: '={{$credentials.serverUrl}}/api',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Blacklisted Domain',
						value: 'blacklistedDomain',
					},
					{
						name: 'Blacklisted Email',
						value: 'blacklistedEmail',
					},
					{
						name: 'Campaign',
						value: 'campaign',
					},
					{
						name: 'Email Account',
						value: 'emailAccount',
					},
					{
						name: 'Lead',
						value: 'lead',
					},
					{
						name: 'Reply',
						value: 'reply',
					},
					{
						name: 'Sequence Step',
						value: 'sequenceStep',
					},
					{
						name: 'Tag',
						value: 'tag',
					},
					{
						name: 'Webhook',
						value: 'webhook',
					},
					{
						name: 'Workspace',
						value: 'workspace',
					},
				],
				default: 'lead',
			},
			...blacklistedDomainOperations,
			...blacklistedEmailOperations,
			...campaignOperations,
			...emailAccountOperations,
			...leadOperations,
			...replyOperations,
			...sequenceStepOperations,
			...tagOperations,
			...webhookOperations,
			...workspaceOperations,
			...blacklistedDomainFields,
			...blacklistedEmailFields,
			...campaignFields,
			...emailAccountFields,
			...leadFields,
			...replyFields,
			...sequenceStepFields,
			...tagFields,
			...webhookFields,
			...workspaceFields,
		],
	};

	methods = {
		loadOptions: {
			// Get all leads for dropdown selection
			async getLeads(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('emailBisonAmineApi');

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'emailBisonAmineApi',
						{
							method: 'GET',
							baseURL: `${credentials.serverUrl}/api`,
							url: '/leads',
							qs: {
								limit: 100,
							},
						},
					);

					const leads = response.data || response;

					if (!Array.isArray(leads)) {
						return [];
					}

					return leads.map((lead: any) => ({
						name: `${lead.first_name || ''} ${lead.last_name || ''} - ${lead.email} (ID: ${lead.id})`.trim(),
						value: lead.id.toString(),
					}));
				} catch (error) {
					return [];
				}
			},

			// Get all campaigns for dropdown selection
			async getCampaigns(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('emailBisonAmineApi');

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'emailBisonAmineApi',
						{
							method: 'GET',
							baseURL: `${credentials.serverUrl}/api`,
							url: '/campaigns',
							qs: {
								limit: 100,
								per_page: 100,
							},
						},
					);

					const campaigns = response.data || response;

					if (!Array.isArray(campaigns)) {
						return [];
					}

					return campaigns.map((campaign: any) => ({
						name: `${campaign.name} - ${campaign.status || 'N/A'} (ID: ${campaign.id})`,
						value: campaign.id.toString(),
					}));
				} catch (error) {
					return [];
				}
			},

			// Get all email accounts (sender emails) for dropdown selection
			async getSenderEmails(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('emailBisonAmineApi');

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'emailBisonAmineApi',
						{
							method: 'GET',
							baseURL: `${credentials.serverUrl}/api`,
							url: '/sender-emails',
							qs: {
								limit: 100,
								per_page: 100,
							},
						},
					);

					const senderEmails = response.data || response;

					if (!Array.isArray(senderEmails)) {
						return [];
					}

					return senderEmails.map((email: any) => ({
						name: `${email.email} - ${email.name || 'N/A'} (ID: ${email.id})`,
						value: email.id.toString(),
					}));
				} catch (error) {
					return [];
				}
			},

			// Get all workspaces for dropdown selection
			async getWorkspaces(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('emailBisonAmineApi');

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'emailBisonAmineApi',
						{
							method: 'GET',
							baseURL: `${credentials.serverUrl}/api`,
							url: '/workspaces/v1.1',
							qs: {
								limit: 100,
								per_page: 100,
							},
						},
					);

					const workspaces = response.data || response;

					if (!Array.isArray(workspaces)) {
						return [];
					}

					return workspaces.map((workspace: any) => ({
						name: `${workspace.name} (ID: ${workspace.id})`,
						value: workspace.id.toString(),
					}));
				} catch (error) {
					return [];
				}
			},

			// Get all tags for dropdown selection
			async getTags(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const credentials = await this.getCredentials('emailBisonAmineApi');

				try {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'emailBisonAmineApi',
						{
							method: 'GET',
							baseURL: `${credentials.serverUrl}/api`,
							url: '/tags',
							qs: {
								limit: 100,
								per_page: 100,
							},
						},
					);

					const tags = response.data || response;

					if (!Array.isArray(tags)) {
						return [];
					}

					return tags.map((tag: any) => ({
						name: `${tag.name} (ID: ${tag.id})`,
						value: tag.id.toString(),
					}));
				} catch (error) {
					return [];
				}
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData;

				if (resource === 'blacklistedDomain') {
					const { executeBlacklistedDomainOperation } = await import('./operations/blacklistedDomains/execute');
					responseData = await executeBlacklistedDomainOperation.call(this, operation, i);
				} else if (resource === 'blacklistedEmail') {
					const { executeBlacklistedEmailOperation } = await import('./operations/blacklistedEmails/execute');
					responseData = await executeBlacklistedEmailOperation.call(this, operation, i);
				} else if (resource === 'campaign') {
					const { executeCampaignOperation } = await import('./operations/campaigns/execute');
					responseData = await executeCampaignOperation.call(this, operation, i);
				} else if (resource === 'emailAccount') {
					const { executeEmailAccountOperation } = await import('./operations/emailAccounts/execute');
					responseData = await executeEmailAccountOperation.call(this, operation, i);
				} else if (resource === 'lead') {
					const { executeLeadOperation } = await import('./operations/leads/execute');
					responseData = await executeLeadOperation.call(this, operation, i);
				} else if (resource === 'reply') {
					const { executeReplyOperation } = await import('./operations/replies/execute');
					responseData = await executeReplyOperation.call(this, operation, i);
				} else if (resource === 'sequenceStep') {
					const { executeSequenceStepOperation } = await import('./operations/sequenceSteps/execute');
					responseData = await executeSequenceStepOperation.call(this, operation, i);
				} else if (resource === 'tag') {
					const { executeTagOperation } = await import('./operations/tags/execute');
					responseData = await executeTagOperation.call(this, operation, i);
				} else if (resource === 'webhook') {
					const { executeWebhookOperation } = await import('./operations/webhooks/execute');
					responseData = await executeWebhookOperation.call(this, operation, i);
				} else if (resource === 'workspace') {
					const { executeWorkspaceOperation } = await import('./operations/workspaces/execute');
					responseData = await executeWorkspaceOperation.call(this, operation, i);
				} else {
					throw new NodeOperationError(this.getNode(), `The resource "${resource}" is not known!`);
				}

				if (Array.isArray(responseData)) {
					returnData.push(...responseData);
				} else {
					returnData.push({ json: responseData, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
					returnData.push({ json: { error: errorMessage }, pairedItem: { item: i } });
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
