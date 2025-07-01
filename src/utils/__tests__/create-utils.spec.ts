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
import { SecretForComponentOption } from '../../components/Secrets/utils/secret-utils';
import { K8sGetResource } from '../../k8s/k8s-fetch';
import {
  K8sQueryCreateResource,
  K8sQueryDeleteResource,
  K8sQueryListResourceItems,
  K8sQueryUpdateResource,
} from '../../k8s/query/fetch';
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
  createPeriodicIntegrationTestCronJob,
  deletePeriodicIntegrationTestCronJob,
  listPeriodicIntegrationTestCronJobs,
} from '../create-utils';
import { mockWindowFetch } from '../test-utils';

jest.mock('../../k8s/k8s-fetch', () => ({
  k8sCreateResource: jest.fn(() => Promise.resolve()),
  k8sUpdateResource: jest.fn(() => Promise.resolve()),
  k8sDeleteResource: jest.fn(() => Promise.resolve()),
  K8sListResourceItems: jest.fn(() => Promise.resolve([])),
  K8sGetResource: jest.fn(() => Promise.resolve()),
}));

jest.mock('../../k8s/query/fetch', () => ({
  K8sQueryCreateResource: jest.fn(() => Promise.resolve()),
  K8sQueryUpdateResource: jest.fn(() => Promise.resolve()),
  K8sQueryDeleteResource: jest.fn(() => Promise.resolve()),
  K8sQueryListResourceItems: jest.fn(() => Promise.resolve([])),
}));

jest.mock('../../components/Secrets/utils/service-account-utils', () => {
  return {
    linkSecretToServiceAccount: jest.fn(),
    linkSecretToBuildServiceAccount: jest.fn(),
    linkSecretToServiceAccounts: jest.fn(),
    updateAnnotateForSecret: jest.fn(),
  };
});

const deleteResourceMock = K8sQueryDeleteResource as jest.Mock;
const listResourceMock = K8sQueryListResourceItems as jest.Mock;
const K8sQueryCreateResourceMock = K8sQueryCreateResource as jest.Mock;
const K8sGetResourceMock = K8sGetResource as jest.Mock;

describe('Create Utils', () => {
  beforeEach(() => {
    mockWindowFetch();
  });
  it('Should call k8s create util with correct model and data for application', async () => {
    await createApplication('test-application', 'test-ns');

    expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
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

    expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
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

    expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
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

    expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
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

    expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
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

    expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
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

    expect(K8sQueryUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      resource: mockComponentDataWithDevfile,
      queryOptions: { ns: 'test-ns' },
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
      true,
    );

    expect(K8sQueryUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      resource: mockComponentDataWithoutAnnotation,
      queryOptions: { ns: 'test-ns' },
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

    expect(K8sQueryUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      resource: mockComponentDataWithPAC,
      queryOptions: { ns: 'test-ns' },
    });
  });

  it('Should call k8s update util with when verb is update', async () => {
    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',

      undefined,
      false,
      mockComponentDataWithDevfile,
      'update',
    );

    expect(K8sQueryUpdateResource).toHaveBeenCalled();
  });

  it('Should delete the environment variables while updating', async () => {
    const mockComponentDataWithEnv = {
      ...mockComponentDataWithDevfile,
      spec: {
        ...mockComponentDataWithDevfile.spec,
        env: [
          {
            name: 'old-key',
            value: 'old-value',
          },
        ],
      },
    };

    await createComponent(
      mockComponentWithDevfile,
      'test-application',
      'test-ns',

      undefined,
      false,
      mockComponentDataWithEnv,
      'update',
    );
    expect(K8sQueryUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: expect.objectContaining({
        spec: expect.objectContaining({
          env: undefined,
        }),
      }),
    });
  });

  it('Should update the environment variables with new values', async () => {
    const mockComponentDataWithEnv = {
      ...mockComponentDataWithDevfile,
      spec: {
        ...mockComponentDataWithDevfile.spec,
        env: [
          {
            name: 'old-key',
            value: 'old-value',
          },
        ],
      },
    };

    const mockComponentWithNewEnv = {
      ...mockComponentWithDevfile,
      env: [
        {
          name: 'new-key',
          value: 'new-value',
        },
      ],
    };

    await createComponent(
      mockComponentWithNewEnv,
      'test-application',
      'test-ns',

      undefined,
      false,
      mockComponentDataWithEnv,
      'update',
    );
    expect(K8sQueryUpdateResource).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
      },
      resource: expect.objectContaining({
        spec: expect.objectContaining({
          env: expect.arrayContaining([
            expect.not.objectContaining({ name: 'old-key', value: 'old-value' }),
            expect.objectContaining({ name: 'new-key', value: 'new-value' }),
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
    K8sQueryCreateResourceMock.mockResolvedValue({
      metadata: { name: 'test-secret', namespace: 'test-ns' },
    });
    K8sGetResourceMock.mockResolvedValue({});
  });

  it('should not call linkToServiceAccounts without secret link option and components', async () => {
    await addSecretWithLinkingComponents({ ...addSecretFormValues }, 'test-ns');
    expect(K8sQueryCreateResourceMock).toHaveBeenCalled();
    expect(enqueueSpy).not.toHaveBeenCalled();
  });

  it('should call linkToServiceAccounts with secret link option', async () => {
    const updatedAddSecretFormValues = {
      ...addSecretFormValues,
      secretForComponentOption: SecretForComponentOption.all,
    };

    await addSecretWithLinkingComponents(updatedAddSecretFormValues, 'test-ns');

    expect(K8sQueryCreateResourceMock).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalled();
    expect(enqueueSpy).toHaveBeenCalledWith(expect.any(Function));
  });

  it('should call linkToServiceAccounts with relatedComponents', async () => {
    const updatedAddSecretFormValues = {
      ...addSecretFormValues,
      secretForComponentOption: SecretForComponentOption.partial,
      relatedComponents: ['component1', 'component2'],
    };

    await addSecretWithLinkingComponents(updatedAddSecretFormValues, 'test-ns');
    expect(K8sQueryCreateResourceMock).toHaveBeenCalled();
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

describe('CronJob Utilities', () => {
  const mockCronJob = {
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    metadata: {
      name: 'test-cronjob',
      namespace: 'test-ns',
      labels: {
        integrationTest: 'test-integration',
        application: 'test-app',
      },
      annotations: {
        'job.openshift.io/display-name': 'Test Job',
      },
    },
    spec: {
      schedule: '0 9 * * *',
      suspend: false,
      jobTemplate: {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'integration-test',
                  image: 'busybox',
                  command: ['echo', 'Run integration test'],
                },
              ],
              restartPolicy: 'Never',
            },
          },
        },
      },
    },
  };

  describe('createPeriodicIntegrationTestCronJob', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create cronJob with correct metadata', async () => {
      K8sQueryCreateResourceMock.mockResolvedValue(mockCronJob);

      const result = await createPeriodicIntegrationTestCronJob(mockCronJob, 'test-ns');

      expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          name: 'test-cronjob',
          ns: 'test-ns',
        },
        resource: mockCronJob,
      });
      expect(result).toEqual(mockCronJob);
    });

    it('should create cronJob with proper integration test container configuration', async () => {
      const expectedCronJob = {
        apiVersion: 'batch/v1',
        kind: 'CronJob',
        metadata: {
          name: 'periodic-integration-test',
          namespace: 'default-tenant',
          labels: {
            integrationTest: 'integration-test',
            application: 'application-default',
          },
          annotations: {
            'job.openshift.io/display-name': 'Periodic Integration Test',
          },
        },
        spec: {
          schedule: '0 0 */2 * *',
          suspend: false,
          jobTemplate: {
            spec: {
              template: {
                spec: {
                  containers: [
                    {
                      name: 'trigger-e2e-scenario',
                      image: 'quay.io/konflux-ci/appstudio-utils:latest',
                      imagePullPolicy: 'Always',
                      command: ['/bin/bash', '-c'],
                      args: [
                        '#!/bin/bash\n' +
                        'set -euo pipefail\n\n' +
                        'export KONFLUX_SCENARIO_NAME="integration-test"\n' +
                        'export KONFLUX_TENANT_NAME="default-tenant"\n' +
                        'export KONFLUX_APPLICATION_NAME="application-default"\n' +
                        'export KONFLUX_COMPONENT_NAME="component-default"\n\n' +
                        'echo -e "[INFO] Fetching latest snapshot from ${KONFLUX_TENANT_NAME} related to push events."\n\n' +
                        'LATEST_SNAPSHOT=$(kubectl get snapshots -n "${KONFLUX_TENANT_NAME}" -o json | \\\n' +
                        '    jq --arg application "$KONFLUX_APPLICATION_NAME" --arg -r \'\\\n' +
                        '        .items\n' +
                        '        | map(select(\n' +
                        '            .metadata.labels."appstudio.openshift.io/application" == $application and\n' +
                        '            .metadata.labels."pac.test.appstudio.openshift.io/event-type" == "push" and\n' +
                        '            (.status.conditions // [] | map(select(\n' +
                        '                .type == "AutoReleased" and\n' +
                        '                .reason == "AutoReleased" and\n' +
                        '                .status == "True"\n' +
                        '                ))\n' +
                        '            | length > 0)\n' +
                        '            ))\n' +
                        '        | sort_by(.metadata.creationTimestamp) | last | .metadata.name\')\n\n\n' +
                        'if [[ -z "${LATEST_SNAPSHOT}" || "${LATEST_SNAPSHOT}" == "null" ]]; then\n' +
                        '  echo -e "[ERROR] No valid snapshot found. The job will not be triggered."\n' +
                        '  exit 1\n' +
                        'fi\n\n' +
                        'echo -e "[INFO] Triggering test scenario ${KONFLUX_SCENARIO_NAME} from snapshot ${LATEST_SNAPSHOT}."\n\n' +
                        'kubectl -n "${KONFLUX_TENANT_NAME}" label snapshot "${LATEST_SNAPSHOT}" test.appstudio.openshift.io/run="${KONFLUX_SCENARIO_NAME}"\n\n' +
                        'echo "[INFO] Integration Service E2E tests successfully triggered!"',
                      ],
                    },
                  ],
                  serviceAccountName: 'default',
                  serviceAccount: 'default',
                  restartPolicy: 'Never',
                },
              },
            },
          },
        },
      };

      K8sQueryCreateResourceMock.mockResolvedValue(expectedCronJob);

      const result = await createPeriodicIntegrationTestCronJob(expectedCronJob, 'default-tenant');

      expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          name: 'periodic-integration-test',
          ns: 'default-tenant',
        },
        resource: expectedCronJob,
      });
      expect(result).toEqual(expectedCronJob);
    });

    it('should handle dry-run parameter', async () => {
      K8sQueryCreateResourceMock.mockResolvedValue(mockCronJob);

      await createPeriodicIntegrationTestCronJob(mockCronJob, 'test-ns', true);

      expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          name: 'test-cronjob',
          ns: 'test-ns',
          queryParams: { dryRun: 'All' },
        },
        resource: mockCronJob,
      });
    });

    it('should reject when creation fails', async () => {
      const error = new Error('Creation failed');
      K8sQueryCreateResourceMock.mockRejectedValue(error);

      await expect(createPeriodicIntegrationTestCronJob(mockCronJob, 'test-ns')).rejects.toThrow(
        'Creation failed',
      );
    });

    it('should handle cronJob without metadata name', async () => {
      const cronJobWithoutName = {
        ...mockCronJob,
        metadata: { ...mockCronJob.metadata, name: undefined },
      };
      K8sQueryCreateResourceMock.mockResolvedValue(cronJobWithoutName);

      await createPeriodicIntegrationTestCronJob(cronJobWithoutName, 'test-ns');

      expect(K8sQueryCreateResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          name: undefined,
          ns: 'test-ns',
        },
        resource: cronJobWithoutName,
      });
    });
  });

  describe('deletePeriodicIntegrationTestCronJob', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should delete cronJob by name and namespace', async () => {
      const mockResponse = { kind: 'Status', status: 'Success' };
      deleteResourceMock.mockResolvedValue(mockResponse);

      const result = await deletePeriodicIntegrationTestCronJob('test-cronjob', 'test-ns');

      expect(deleteResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          name: 'test-cronjob',
          ns: 'test-ns',
        },
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle deletion of non-existent job gracefully', async () => {
      const error = new Error('Not found');
      deleteResourceMock.mockRejectedValue(error);

      await expect(
        deletePeriodicIntegrationTestCronJob('non-existent-job', 'test-ns'),
      ).rejects.toThrow('Not found');
    });

    it('should handle empty job name', async () => {
      const mockResponse = { kind: 'Status', status: 'Success' };
      deleteResourceMock.mockResolvedValue(mockResponse);

      await deletePeriodicIntegrationTestCronJob('', 'test-ns');

      expect(deleteResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          name: '',
          ns: 'test-ns',
        },
      });
    });
  });

  describe('listPeriodicIntegrationTestCronJobs', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should list cronJobs with labelSelector', async () => {
      const mockJobs = [mockCronJob];
      listResourceMock.mockResolvedValue({ items: mockJobs });

      const result = await listPeriodicIntegrationTestCronJobs('test-ns', 'application=test-app');

      expect(listResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          ns: 'test-ns',
          queryParams: { labelSelector: 'application=test-app' },
        },
      });
      expect(result).toEqual(mockJobs);
    });

    it('should handle response with items array', async () => {
      const mockJobs = [mockCronJob];
      listResourceMock.mockResolvedValue({ items: mockJobs });

      const result = await listPeriodicIntegrationTestCronJobs('test-ns');

      expect(result).toEqual(mockJobs);
    });

    it('should handle direct array response', async () => {
      const mockJobs = [mockCronJob];
      listResourceMock.mockResolvedValue(mockJobs);

      const result = await listPeriodicIntegrationTestCronJobs('test-ns');

      expect(result).toEqual(mockJobs);
    });

    it('should return empty array for undefined result', async () => {
      listResourceMock.mockResolvedValue(undefined);

      const result = await listPeriodicIntegrationTestCronJobs('test-ns');

      expect(result).toEqual([]);
    });

    it('should return empty array for null result', async () => {
      listResourceMock.mockResolvedValue(null);

      const result = await listPeriodicIntegrationTestCronJobs('test-ns');

      expect(result).toEqual([]);
    });

    it('should handle unexpected response format', async () => {
      listResourceMock.mockResolvedValue({ unexpected: 'format' });

      const result = await listPeriodicIntegrationTestCronJobs('test-ns');

      expect(result).toEqual([]);
    });

    it('should handle API errors', async () => {
      const error = new Error('API Error');
      listResourceMock.mockRejectedValue(error);

      await expect(listPeriodicIntegrationTestCronJobs('test-ns')).rejects.toThrow('API Error');
    });

    it('should call without labelSelector when not provided', async () => {
      const mockJobs = [mockCronJob];
      listResourceMock.mockResolvedValue({ items: mockJobs });

      await listPeriodicIntegrationTestCronJobs('test-ns');

      expect(listResourceMock).toHaveBeenCalledWith({
        model: expect.objectContaining({
          kind: 'CronJob',
        }),
        queryOptions: {
          ns: 'test-ns',
        },
      });
    });
  });
});
