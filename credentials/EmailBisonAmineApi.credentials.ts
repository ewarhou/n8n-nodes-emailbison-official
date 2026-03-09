import type {
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
  IHttpRequestOptions,
  ICredentialDataDecryptedObject,
} from 'n8n-workflow';

export class EmailBisonAmineApi implements ICredentialType {
  name = 'emailBisonAmineApi';

  displayName = 'EmailBison API';

  documentationUrl = 'https://docs.emailbison.com/get-started/authentication';

  icon: 'file:emailbison.svg' = 'file:emailbison.svg';

  properties: INodeProperties[] = [
    {
      displayName: 'Server URL',
      name: 'serverUrl',
      type: 'string',
      noDataExpression: true,
      default: 'https://send.topoffunnel.com',
      placeholder: 'https://send.youragency.com',
      description: 'The base URL of your EmailBison instance (without /api)',
      required: true,
    },
    {
      displayName: 'API Token',
      name: 'apiToken',
      type: 'string',
      typeOptions: { password: true },
      noDataExpression: true,
      default: '',
      description: 'Your EmailBison API token. Paste only the token — Bearer is added automatically.',
      required: true,
    },
  ];

  authenticate = async (
    credentials: ICredentialDataDecryptedObject,
    requestOptions: IHttpRequestOptions,
  ): Promise<IHttpRequestOptions> => {
    requestOptions.headers = {
      ...(requestOptions.headers ?? {}),
      Authorization: `Bearer ${credentials.apiToken}`,
    };
    return requestOptions;
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.serverUrl}}/api',
      url: '/users',
      method: 'GET',
    },
    rules: [
      {
        type: 'responseSuccessBody',
        properties: {
          key: 'data',
          message: 'Invalid credentials or server URL. Please check your API token and server URL.',
          value: undefined,
        },
      },
    ],
  };
}
