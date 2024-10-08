import { omit } from 'lodash-es';
// import { THUMBNAIL_ANNOTATION } from '../../components/ApplicationDetails/ApplicationThumbnail';
// import { linkSecretToServiceAccount } from '../../components/Secrets/utils/service-account-utils';
import { THUMBNAIL_ANNOTATION } from '../../components/ApplicationThumbnail';
import { commonFetch } from '../../k8s/fetch';
import { k8sCreateResource, k8sUpdateResource } from '../../k8s/k8s-fetch';
import { ApplicationModel } from '../../models/application';
import { ComponentModel } from '../../models/component';
import {
  // AddSecretFormValues,
  // SecretFor,
  SecretTypeDropdownLabel,
} from '../../types';
import { ComponentKind, ComponentSpecs } from '../../types/component';
import {
  createApplication,
  createComponent,
  sanitizeName,
  createSecret,
  // addSecret,
} from '../create-utils';

jest.mock('../../k8s/fetch', () => {
  const actual = jest.requireActual('../../k8s/fetch');
  return {
    ...actual,
    commonFetch: jest.fn(),
  };
});

jest.mock('../../k8s/k8s-fetch', () => ({
  k8sCreateResource: jest.fn(() => Promise.resolve()),
  k8sUpdateResource: jest.fn(() => Promise.resolve()),
}));

/**
 * [TODO]: enable test for linkSecret and secret utils
 */

// jest.mock('../../components/Secrets/utils/service-account-utils', () => {
//   return { linkSecretToServiceAccount: jest.fn() };
// });

const createResourceMock = k8sCreateResource as jest.Mock;
const commonFetchMock = commonFetch as jest.Mock;
// const linkSecretToServiceAccountMock = linkSecretToServiceAccount as jest.Mock;

jest.mock('../../components/ApplicationThumbnail', () => {
  const actual = jest.requireActual('../../components/ApplicationThumbnail');
  return { ...actual, getRandomSvgNumber: () => 7 };
});

const mockApplicationRequestData = {
  apiVersion: `${ApplicationModel.apiGroup}/${ApplicationModel.apiVersion}`,
  kind: ApplicationModel.kind,
  metadata: {
    name: 'test-application',
    namespace: 'test-ns',
    annotations: {
      [THUMBNAIL_ANNOTATION]: '7',
    },
  },
  spec: {
    displayName: 'test-application',
  },
};

const mockComponent: ComponentSpecs = {
  componentName: 'Test Component',
  application: 'test-application',
  source: {
    git: {
      url: 'http://github.com/test-repo',
    },
  },
};

const mockComponentWithDevfile = {
  ...mockComponent,
  source: {
    git: {
      ...mockComponent.source.git,
      devfileUrl: 'https://registry.devfile.io/sample-devfile',
    },
  },
};

const mockComponentData: ComponentKind = {
  apiVersion: `${ComponentModel.apiGroup}/${ComponentModel.apiVersion}`,
  kind: ComponentModel.kind,
  metadata: {
    name: 'test-component',
    namespace: 'test-ns',
    annotations: {
      'build.appstudio.openshift.io/request': 'configure-pac',
    },
  },
  spec: {
    componentName: mockComponent.componentName,
    application: 'test-application',
    source: {
      git: { url: mockComponent.source.git.url },
    },
    containerImage: undefined,
    env: undefined,
    replicas: undefined,
    resources: undefined,
    secret: undefined,
  },
};

const mockComponentDataWithDevfile: ComponentKind = {
  ...mockComponentData,
  spec: {
    ...mockComponentData.spec,
    source: {
      git: {
        url: mockComponent.source.git.url,
        devfileUrl: 'https://registry.devfile.io/sample-devfile',
      },
    },
  },
};

const mockComponentDataWithoutAnnotation = omit(
  mockComponentDataWithDevfile,
  'metadata.annotations',
);

const mockComponentDataWithPAC = {
  ...mockComponentDataWithDevfile,
  metadata: {
    ...mockComponentDataWithDevfile.metadata,
    annotations: {
      'build.appstudio.openshift.io/request': 'configure-pac',
    },
  },
};

// const addSecretFormValues: AddSecretFormValues = {
//   type: 'Image pull secret',
//   name: 'test',
//   secretFor: SecretFor.Build,
//   opaque: {
//     keyValues: [
//       {
//         key: 'test',
//         value: 'dGVzdA==',
//       },
//     ],
//   },
//   image: {
//     authType: 'Image registry credentials',
//     registryCreds: [
//       {
//         registry: 'test.io',
//         username: 'test',
//         password: 'test',
//         email: 'test@test.com',
//       },
//     ],
//   },
//   source: {
//     authType: 'Basic authentication',
//     username: 'test',
//     password: 'test',
//   },
//   labels: [{ key: 'test', value: 'test' }],
// };
describe('Create Utils', () => {
  beforeEach(() => {
    // mockFetch();
  });
  it('Should call k8s create util with correct model and data for application', async () => {
    await createApplication('test-application', 'test-ns', 'test-ws');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ApplicationModel,
      queryOptions: {
        name: 'test-application',
        ns: 'test-ns',
        ws: 'test-ws',
      },
      resource: mockApplicationRequestData,
    });
  });

  it('Should call k8s create util with correct model and data for component', async () => {
    await createComponent(mockComponent, 'test-application', 'test-ns', 'test-ws');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
        ws: 'test-ws',
      },
      resource: mockComponentData,
    });
  });

  it('Should call k8s create util with correct model and data for component with devfile', async () => {
    await createComponent(mockComponentWithDevfile, 'test-application', 'test-ns', 'test-ws');

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
        ws: 'test-ws',
      },
      resource: mockComponentDataWithDevfile,
    });
  });

  it('Should create component with target port', async () => {
    const mockComponentDataWithTargetPort = {
      ...mockComponent,
      targetPort: 8080,
    };
    await createComponent(
      mockComponentDataWithTargetPort,
      'test-application',
      'test-ns',
      'test-ws',
    );

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
        ws: 'test-ws',
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
    await createComponent(
      mockComponentDataWithoutTargetPort,
      'test-application',
      'test-ns',
      'test-ws',
    );

    expect(k8sCreateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: 'test-component',
        ns: 'test-ns',
        ws: 'test-ws',
      },
      resource: mockComponentData,
    });
  });

  it('Should call k8s create util with pipelines-as-code annotations', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',
      'test-ws',
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
        ws: 'test-ws',
      },
      resource: mockComponentDataWithPAC,
    });
  });

  it('Should not update pipelines-as-code annotations for the existing components without pac annotations', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',
      'test-ws',
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
        ws: 'test-ws',
      },
      resource: mockComponentDataWithDevfile,
    });
  });

  it('Should not add skip-initial-checks annotations while updating existing components', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',
      'test-ws',
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
        ws: 'test-ws',
      },
      resource: mockComponentDataWithoutAnnotation,
    });
  });

  it('Should contain pipelines-as-code annotations for the existing components with pac annotations', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',
      'test-ws',
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
        ws: 'test-ws',
      },
      resource: mockComponentDataWithPAC,
    });
  });

  it('Should call k8s update util with when verb is update', async () => {
    await createComponent(
      mockComponent,
      'test-application',
      'test-ns',
      'test-ws',
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
      'test-ws',
      '',
      false,
      oldComponentSpecWithEnv,
      'update',
    );
    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
        ws: 'test-ws',
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
      'test-ws',
      '',
      false,
      oldComponentSpecWithEnv,
      'update',
    );
    expect(k8sUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
        ws: 'test-ws',
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

  it('should call the create secret api with dryRun query string params', async () => {
    createResourceMock.mockClear().mockImplementationOnce((props) => Promise.resolve(props));
    commonFetchMock.mockClear().mockImplementation((props) => Promise.resolve(props));

    await createSecret(
      {
        secretName: 'my-snyk-secret',
        type: SecretTypeDropdownLabel.opaque,
        keyValues: [{ key: 'token', value: 'my-token-data' }],
      },
      'test-ws',
      'test-ns',
      true,
    );

    expect(commonFetchMock).toHaveBeenCalledTimes(1);

    expect(commonFetchMock).toHaveBeenCalledWith(
      '/workspaces/test-ws/api/v1/namespaces/test-ns/secrets?dryRun=All',
      expect.objectContaining({
        body: expect.stringContaining('"kind":"Secret"'),
      }),
    );
  });

  it('should create a key/value secret', async () => {
    commonFetchMock.mockClear();
    commonFetchMock.mockImplementationOnce((props) => Promise.resolve(props));

    await createSecret(
      {
        secretName: 'my-snyk-secret',
        type: SecretTypeDropdownLabel.opaque,
        keyValues: [{ key: 'token', value: 'my-token-data' }],
      },
      'test-ws',
      'test-ns',
      false,
    );

    expect(commonFetchMock).toHaveBeenCalledTimes(1);

    expect(commonFetchMock).toHaveBeenCalledWith(
      '/workspaces/test-ws/api/v1/namespaces/test-ns/secrets',
      expect.objectContaining({
        body: expect.stringContaining('"type":"Opaque"'),
      }),
    );
  });

  it('should create a Image pull secret', async () => {
    commonFetchMock.mockClear();
    commonFetchMock.mockImplementationOnce((props) => Promise.resolve(props));

    await createSecret(
      {
        secretName: 'registry-creds',
        type: SecretTypeDropdownLabel.image,
        keyValues: [{ key: 'token', value: 'my-token-data' }],
      },
      'test-ws',
      'test-ns',
      false,
    );

    expect(commonFetchMock).toHaveBeenCalledTimes(1);

    expect(commonFetchMock).toHaveBeenCalledWith(
      '/workspaces/test-ws/api/v1/namespaces/test-ns/secrets',
      expect.objectContaining({
        body: expect.stringContaining('"type":"kubernetes.io/dockerconfigjson"'),
      }),
    );
  });

  it('should create partner task secret', async () => {
    commonFetchMock.mockClear();
    createResourceMock
      .mockClear()
      .mockImplementationOnce((props) => Promise.resolve(props))
      .mockImplementationOnce((props) => Promise.resolve(props));

    await createSecret(
      {
        secretName: 'snyk-secret',
        type: SecretTypeDropdownLabel.opaque,
        keyValues: [{ key: 'token', value: 'my-token-data' }],
      },
      'test-ws',
      'test-ns',
      false,
    );

    expect(commonFetchMock).toHaveBeenCalled();
  });
  // it('should add secret', async () => {
  //   commonFetchMock.mockClear();
  //   await addSecret(addSecretFormValues, 'test-ws', 'test-ns', 'test-ws');
  //   expect(commonFetchMock).toHaveBeenCalled();

  //   expect(commonFetchMock).toHaveBeenCalledWith(
  //     '/workspaces/test-ws/api/v1/namespaces/test-ns/secrets',
  //     expect.objectContaining({
  //       body: expect.stringContaining('"type":"kubernetes.io/dockerconfigjson"'),
  //     }),
  //   );
  // });

  // it('should call linkToServiceAccount For image pull secrets', async () => {
  //   linkSecretToServiceAccountMock.mockClear();
  //   await addSecret(addSecretFormValues, 'test-ws', 'test-ns', 'test-ws');
  //   expect(linkSecretToServiceAccountMock).toHaveBeenCalled();
  //   expect(linkSecretToServiceAccountMock).toHaveBeenCalledWith(
  //     expect.objectContaining({ metadata: expect.objectContaining({ name: 'test' }) }),
  //     'test-ns',
  //   );
  // });
});
