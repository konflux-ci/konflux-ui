import { SecretType } from '../../../types';
import {
  createApplication,
  createComponent,
  createImageRepository,
  createSecretWithLinkingComponents,
} from '../../../utils/create-utils';
import { createIntegrationTest } from '../../IntegrationTests/IntegrationTestForm/utils/create-utils';
import { createResourcesWithLinkingComponents } from '../submit-utils';

jest.mock('../../../utils/create-utils', () => ({
  ...jest.requireActual('../../../utils/create-utils'),
  createApplication: jest.fn(),
  createComponent: jest.fn(),
  createImageRepository: jest.fn(),
  createSecret: jest.fn(),
  createSecretWithLinkingComponents: jest.fn(),
  useRef: jest.fn(() => ({ current: null })),
}));

jest.mock('../../IntegrationTests/IntegrationTestForm/utils/create-utils', () => ({
  createIntegrationTest: jest.fn(),
}));

const createApplicationMock = createApplication as jest.Mock;
const createComponentMock = createComponent as jest.Mock;
const createIntegrationTestMock = createIntegrationTest as jest.Mock;
const createImageRepositoryMock = createImageRepository as jest.Mock;
const createSecretWithLinkingComponentsMock = createSecretWithLinkingComponents as jest.Mock;
const mockSecret = {
  existingSecrets: [],
  type: 'Opaque',
  secretName: 'new-secret',
  opaque: {
    keyValues: [{ key: 'token', value: 'value', readOnlyKey: true }],
  },
};

describe('Submit Utils: createResources', () => {
  it('should create application and components', async () => {
    createApplicationMock.mockResolvedValue({ metadata: { name: 'test-app' } });
    createComponentMock.mockResolvedValue({ metadata: { name: 'test-component' } });
    await createResourcesWithLinkingComponents(
      {
        application: 'test-app',
        inAppContext: false,
        showComponent: true,
        isPrivateRepo: false,
        source: {
          git: {
            url: 'https://github.com/',
          },
        },
        pipeline: 'dbcd',
        componentName: 'component',
      },
      'test-ws-tenant',
      [],
    );
    expect(createApplicationMock).toHaveBeenCalledTimes(2);
    expect(createIntegrationTestMock).toHaveBeenCalledTimes(2);
    expect(createComponentMock).toHaveBeenCalledTimes(2);
    expect(createImageRepositoryMock).toHaveBeenCalledTimes(2);
  });

  it('should create application but not components', async () => {
    createApplicationMock.mockResolvedValue({ metadata: { name: 'test-app' } });
    createComponentMock.mockResolvedValue({ metadata: { name: 'test-component' } });
    await createResourcesWithLinkingComponents(
      {
        application: 'test-app',
        inAppContext: false,
        showComponent: false,
        isPrivateRepo: false,
        source: {
          git: {
            url: 'https://github.com/',
          },
        },
        pipeline: 'dbcd',
        componentName: 'component',
      },
      'test-ws-tenant',
      [],
    );
    expect(createApplicationMock).toHaveBeenCalledTimes(2);
    expect(createIntegrationTestMock).toHaveBeenCalledTimes(2);
    expect(createComponentMock).toHaveBeenCalledTimes(0);
    expect(createImageRepositoryMock).toHaveBeenCalledTimes(0);
  });

  it('should not create application but create components without secrets', async () => {
    createApplicationMock.mockResolvedValue({ metadata: { name: 'test-app' } });
    createComponentMock.mockResolvedValue({ metadata: { name: 'test-component' } });
    await createResourcesWithLinkingComponents(
      {
        application: 'test-app',
        inAppContext: true,
        showComponent: true,
        isPrivateRepo: true,
        source: {
          git: {
            url: 'https://github.com/',
          },
        },
        pipeline: 'dbcd',
        componentName: 'component',
        importSecrets: [
          {
            existingSecrets: [
              {
                name: 'secret',
                type: SecretType.opaque,
                providerUrl: '',
                tokenKeyName: 'secret',
                opaque: {
                  keyValuePairs: [
                    {
                      key: 'secret',
                      value: 'value',
                      readOnlyKey: true,
                    },
                  ],
                },
              },
            ],
            type: 'Opaque',
            secretName: 'secret',
            opaque: { keyValues: [{ key: 'secret', value: 'test-value', readOnlyKey: true }] },
          },
        ],
      },
      'test-ws-tenant',
      [],
    );
    expect(createApplicationMock).toHaveBeenCalledTimes(0);
    expect(createIntegrationTestMock).toHaveBeenCalledTimes(0);
    expect(createComponentMock).toHaveBeenCalledTimes(2);
    expect(createImageRepositoryMock).toHaveBeenCalledTimes(2);
  });

  it('should not create application, create components and secret', async () => {
    createApplicationMock.mockResolvedValue({ metadata: { name: 'test-app' } });
    createComponentMock.mockResolvedValue({ metadata: { name: 'test-component' } });
    await createResourcesWithLinkingComponents(
      {
        application: 'test-app',
        inAppContext: true,
        showComponent: true,
        isPrivateRepo: false,
        source: {
          git: {
            url: 'https://github.com/',
          },
        },
        pipeline: 'dbcd',
        componentName: 'component',
        importSecrets: [],
      },
      'test-ws-tenant',
      [],
    );
    expect(createApplicationMock).toHaveBeenCalledTimes(0);
    expect(createIntegrationTestMock).toHaveBeenCalledTimes(0);
    expect(createComponentMock).toHaveBeenCalledTimes(2);
    expect(createImageRepositoryMock).toHaveBeenCalledTimes(2);
  });

  it('should create secrets only if not existing', async () => {
    createApplicationMock.mockResolvedValue({ metadata: { name: 'test-app' } });
    createComponentMock.mockResolvedValue({ metadata: { name: 'test-component' } });
    createSecretWithLinkingComponentsMock.mockResolvedValue(undefined);

    await createResourcesWithLinkingComponents(
      {
        application: 'test-app',
        inAppContext: true,
        showComponent: true,
        isPrivateRepo: false,
        source: { git: { url: 'https://github.com/' } },
        pipeline: 'pipeline',
        componentName: 'component',
        importSecrets: [mockSecret],
      },
      'test-ns',
      [],
    );

    expect(createSecretWithLinkingComponentsMock).toHaveBeenCalledTimes(2);
  });

  it('should skip secret creation for already existing secrets', async () => {
    const mockSecretWithExistingOnes = {
      secretName: 'existing-secret',
      opaque: { keyValues: [{ key: 'token', value: 'value', readOnlyKey: true }] },
      type: SecretType.opaque,
      existingSecrets: [
        {
          name: 'existing-secret',
          type: SecretType.opaque,
          providerUrl: '',
          tokenKeyName: 'token',
          opaque: { keyValuePairs: [] },
        },
      ],
    };
    await createResourcesWithLinkingComponents(
      {
        application: 'test-app',
        inAppContext: true,
        showComponent: true,
        isPrivateRepo: false,
        source: { git: { url: 'https://github.com/' } },
        pipeline: 'pipeline',
        componentName: 'component',
        importSecrets: [mockSecretWithExistingOnes],
      },
      'test-ns',
      [],
    );

    expect(createSecretWithLinkingComponentsMock).not.toHaveBeenCalled();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
