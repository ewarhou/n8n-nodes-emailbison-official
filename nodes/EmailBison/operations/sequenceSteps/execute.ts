import { IExecuteFunctions, IDataObject, INodeExecutionData, NodeOperationError } from 'n8n-workflow';

export async function executeSequenceStepOperation(
	this: IExecuteFunctions,
	operation: string,
	index: number,
): Promise<IDataObject | INodeExecutionData[]> {
	const credentials = await this.getCredentials('emailBisonAmineApi');

	if (operation === 'sendTest') {
		// Send test email from sequence step
		const sequenceStepId = this.getNodeParameter('sequenceStepId', index) as string;
		const senderEmailId = this.getNodeParameter('senderEmailId', index) as string;
		const toEmail = this.getNodeParameter('toEmail', index) as string;
		const useDedicatedIps = this.getNodeParameter('useDedicatedIps', index, false) as boolean;

		const body: IDataObject = {
			sender_email_id: senderEmailId,
			to_email: toEmail,
			use_dedicated_ips: useDedicatedIps,
		};

		const responseData = await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'POST',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/sequence-steps/${sequenceStepId}/send-test`,
				body,
			},
		);

		return [{ json: responseData.data || responseData, pairedItem: { item: index } }];
	}

	if (operation === 'delete') {
		// Delete sequence step
		const sequenceStepId = this.getNodeParameter('sequenceStepId', index) as string;

		await this.helpers.httpRequestWithAuthentication.call(
			this,
			'emailBisonAmineApi',
			{
				method: 'DELETE',
				baseURL: `${credentials.serverUrl}/api`,
				url: `/campaigns/sequence-steps/${sequenceStepId}`,
			},
		);

		return [{ json: { success: true, id: sequenceStepId }, pairedItem: { item: index } }];
	}

	throw new NodeOperationError(this.getNode(), `Unknown operation: ${operation}`);
}
