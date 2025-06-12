import { SecretForComponentOption } from '~/components/Secrets/utils/secret-utils';
import {
  addSecretFormValues,
  mockApplicationRequestData,
  mockComponent,
  mockComponentData,
  mockComponentDataWithDevfile,
  mockComponentDataWithoutAnnotation,
  mockComponentDataWithPAC,
  mockComponentWithDevfile,
  secretFormValues,
} from '../../components/Secrets/__data__/mock-secrets';
import { linkSecretToServiceAccounts } from '../../components/Secrets/utils/service-account-utils';
import { k8sCreateResource, k8sUpdateResource } from '../../k8s/k8s-fetch';
import { SecretModel } from '../../models';
import { ApplicationModel } from '../../models/application';
import { ComponentModel } from '../../models/component';
import { queueInstance } from '../async-queue';
import {
  createApplication,
  createComponent,
  sanitizeName,
  getSecretObject,
  addSecretWithLinkingComponents,
} from '../create-utils';
import { mockWindowFetch } from '../test-utils';

jest.mock('../../k8s/k8s-fetch', () => ({
  k8sCreateResource: jest.fn(() => Promise.resolve()),
  k8sUpdateResource: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../components/Secrets/utils/service-account-utils', () => {
  return {
    linkSecretToServiceAccount: jest.fn(),
    linkSecretToBuildServiceAccount: jest.fn(),
    linkSecretToServiceAccounts: jest.fn(),
    updateAnnotateForSecret: jest.fn(),
  };
});

const createResourceMock = k8sCreateResource as jest.Mock;
const linkSecretToServiceAccountsMock = linkSecretToServiceAccounts as jest.Mock;

describe('Create Utils', () => {
  beforeEach(() => {
    mockWindowFetch();
  });
  it('Should call k8s create util with correct model and data for application', async () => {
    await createApplication('test-application', 'test-ns');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ApplicationModel,
      queryOptions: {
        name: 'test-application',
        ns: 'test-ns',
      },
      resource: mockApplicationRequestData,
    });
  });

  it('Should call k8s create util with correct model and data for component', async () => {
    await createComponent(mockComponent, 'test-application', 'test-ns');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
      },
      resource: mockComponentData,
    });
  });

  it('Should call k8s create util with correct model and data for component with devfile', async () => {
    await createComponent(mockComponentWithDevfile, 'test-application', 'test-ns');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
      },
      resource: mockComponentDataWithDevfile,
    });
  });

  it('Should create component with target port', async () => {
    const mockComponentDataWithTargetPort = {
      ...mockComponent,
      targetPort: 8080,
    };
    await createComponent(mockComponentDataWithTargetPort, 'test-application', 'test-ns');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
      },
      resource: {
        ...mockComponentData,
        spec: {
          ...mockComponentData.spec,
          targetPort: 8080,
        },
      },
    });
  });

  it('Should create component without target port, if it is not passed', async () => {
    const mockComponentDataWithoutTargetPort = {
      ...mockComponent,
      targetPort: undefined,
    };
    await createComponent(mockComponentDataWithoutTargetPort, 'test-application', 'test-ns');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
      },
      resource: mockComponentData,
    });
  });

  it('Should call k8s create util with pipelines-as-code annotations', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',

      undefined,
      false,
      null,
      'create',
      true,
    );

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
      },
      resource: mockComponentDataWithPAC,
    });
  });

  it('Should not update pipelines-as-code annotations for the existing components without pac annotations', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',

      undefined,
      false,
      mockComponentDataWithDevfile,
      'update',
      true,
    );

    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: mockComponentDataWithDevfile,
    });
  });

  it('Should not add skip-initial-checks annotations while updating existing components', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',

      undefined,
      false,
      mockComponentDataWithoutAnnotation,
      'update',
      false,
    );

    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: mockComponentDataWithoutAnnotation,
    });
  });

  it('Should contain pipelines-as-code annotations for the existing components with pac annotations', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',
      undefined,
      false,
      mockComponentDataWithPAC,
      'update',
      true,
    );

    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: mockComponentDataWithPAC,
    });
  });

  it('Should call k8s update util with when verb is update', async () => {
    await createComponent(
      mockComponent,
      'test-application',
      'test-ns',

      '',
      false,
      mockComponentData,
      'update',
    );

    expect(k8sUpdateResource).toHaveBeenCalled();
  });

  it('Should delete the environment variables while updating', async () => {
    const oldComponentSpecWithEnv = {
      ...mockComponentData,
      spec: {
        ...mockComponentData.spec,
        env: [{ name: 'env', value: 'test' }],
      },
    };

    const updatedComponentWithoutEnv = {
      ...mockComponentData.spec,
      env: undefined,
    };

    await createComponent(
      updatedComponentWithoutEnv,
      'test-application',
      'test-ns',

      '',
      false,
      oldComponentSpecWithEnv,
      'update',
    );
    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: expect.objectContaining({
        spec: expect.objectContaining({ env: undefined }),
      }),
    });
  });

  it('Should update the environment variables with new values', async () => {
    const oldComponentSpecWithEnv = {
      ...mockComponentData,
      spec: {
        ...mockComponentData.spec,
        env: [{ name: 'old-key', value: 'old-value' }],
      },
    };

    const updatedComponentWithoutEnv = {
      ...mockComponentData.spec,
      env: [{ name: 'new-key', value: 'new-value' }],
    };

    await createComponent(
      updatedComponentWithoutEnv,
      'test-application',
      'test-ns',

      '',
      false,
      oldComponentSpecWithEnv,
      'update',
    );
    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: expect.objectContaining({
        spec: expect.objectContaining({
          env: expect.arrayContaining([
            expect.not.objectContaining({
              name: 'old-key',
              value: 'old-value',
            }),
            expect.objectContaining({
              name: 'new-key',
              value: 'new-value',
            }),
          ]),
        }),
      }),
    });
  });

  it('should sanize spaces in resource names', () => {
    expect(sanitizeName('my app')).toBe('my-app');
    expect(sanitizeName('my-app')).toBe('my-app');
    // does not handle special characters
    expect(sanitizeName('!  @  #')).toBe('!--@--#');
  });
});

jest.mock('../task-store', () => ({
  useTaskStore: {
    getState: jest.fn(() => ({
      setTaskStatus: jest.fn(),
      clearTask: jest.fn(),
    })),
  },
  BackgroundJobStatus: {
    Running: 'Running',
    Successed: 'Successed',
    Pending: 'Pending',
  },
}));

const enqueueSpy = jest.spyOn(queueInstance, 'enqueue').mockImplementation(async (task) => {
  await task(); // simulate task execution
});

describe('create-utils addSecretWithLinkingComponents', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createResourceMock.mockResolvedValue({
      metadata: { name: 'test-secret' },
    });
  });

  it('should not call linkToServiceAccounts without secret link option and components', async () => {
    await addSecretWithLinkingComponents({ ...addSecretFormValues }, 'test-ns');
    expect(createResourceMock).toHaveBeenCalled();
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it('should call linkToServiceAccounts with secret link option', async () => {
    const updatedAddSecretFormValues = {
      ...addSecretFormValues,
      secretForComponentOption: SecretForComponentOption.all,
      relatedComponents: [],
    };

    await addSecretWithLinkingComponents(updatedAddSecretFormValues, 'test-ns');

    expect(createResourceMock).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should call linkToServiceAccounts with relatedComponents', async () => {
    linkSecretToServiceAccountsMock.mockClear();
    const updatedAddSecretFormValues = {
      ...addSecretFormValues,
      secretForComponentOption: SecretForComponentOption.partial,
      relatedComponents: ['test-component-1'],
    };

    await addSecretWithLinkingComponents(updatedAddSecretFormValues, 'test-ns');
    expect(createResourceMock).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalledWith(expect.any(Function));
  });
});

describe('create-utils getSecretObject', () => {
  beforeEach(() => {
    mockWindowFetch();
  });

  it('should create a secret object', () => {
    const obj = getSecretObject(secretFormValues, 'test-ns');
    expect(obj.kind).toBe(SecretModel.kind);
  });

  it('should create a correct fields', () => {
    const obj = getSecretObject(secretFormValues, 'test-ns');
    expect(obj.stringData).toEqual({ test: 'dGVzdA==' });
  });
});
