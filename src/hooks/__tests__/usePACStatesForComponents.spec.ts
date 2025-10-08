import { renderHook } from '@testing-library/react-hooks';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useTRPipelineRuns } from '../../hooks/useTektonResults';
import { ComponentKind } from '../../types';
import {
  BUILD_REQUEST_ANNOTATION,
  BUILD_STATUS_ANNOTATION,
  ComponentBuildState,
  getConfigurationTime,
  LAST_CONFIGURATION_ANNOTATION,
  SAMPLE_ANNOTATION,
} from '../../utils/component-utils';
import { createK8sWatchResourceMock, createUseApplicationMock } from '../../utils/test-utils';
import { PACState } from '../usePACState';
import usePACStatesForComponents from '../usePACStatesForComponents';

jest.mock('../../hooks/useTektonResults');

jest.mock('../../hooks/useApplicationPipelineGitHubApp', () => ({
  useApplicationPipelineGitHubApp: jest.fn(() => ({
    name: 'test-app',
    url: 'https://github.com/test-app',
  })),
}));

createUseApplicationMock([{ metadata: { name: 'test' } }, true]);

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useTRPipelineRunsMock = useTRPipelineRuns as jest.Mock;

const createComponent = (
  componentName: string,
  buildState?: ComponentBuildState,
  sampleAnnotation?: string,
  buildAnnotation?: string,
  migration = false,
): ComponentKind =>
  ({
    metadata: {
      namespace: 'test-ns',
      name: componentName,
      annotations: {
        [SAMPLE_ANNOTATION]: sampleAnnotation,
        [BUILD_REQUEST_ANNOTATION]: buildAnnotation,
        [BUILD_STATUS_ANNOTATION]:
          buildState &&
          JSON.stringify({
            pac: { state: buildState, 'configuration-time': 'Wed, 21 Jul 2023 19:36:25 UTC' },
          }),
        [LAST_CONFIGURATION_ANNOTATION]:
          migration &&
          JSON.stringify({
            metadata: {
              annotations: {
                [BUILD_STATUS_ANNOTATION]: JSON.stringify({
                  pac: { state: buildState, 'configuration-time': 'Wed, 21 Jan 2023 19:36:25 UTC' },
                }),
                [BUILD_REQUEST_ANNOTATION]: 'configure-pac-no-mr',
              },
            },
          }),
      },
    },
    spec: {
      source: {
        git: {
          url: 'https://github.com/org/test',
        },
      },
    },
  }) as unknown as ComponentKind;

describe('usePACStatesForComponents', () => {
  it('should identify different simple states', () => {
    useK8sWatchResourceMock.mockReturnValue([[], true]);
    const components = [
      createComponent('my-component', undefined, 'true'),
      createComponent('my-disabled-component'),
      createComponent('my-config-component', undefined, undefined, 'configure-pac'),
      createComponent('my-unconfigure-component', undefined, undefined, 'unconfigure-pac'),
      createComponent('my-error-component', ComponentBuildState.error),
    ];
    const results = renderHook(() => usePACStatesForComponents(components)).result.current;
    expect(results['my-component']).toBe(PACState.sample);
    expect(results['my-disabled-component']).toBe(PACState.disabled);
    expect(results['my-config-component']).toBe(PACState.configureRequested);
    expect(results['my-unconfigure-component']).toBe(PACState.unconfigureRequested);
    expect(results['my-error-component']).toBe(PACState.error);
  });

  it('should identify ready and pending states', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [
        {
          metadata: {
            name: 'test',
            creationTimestamp: '2023-07-25T00:00:00Z',
            labels: { [PipelineRunLabel.COMPONENT]: 'my-ready-component' },
          },
        },
      ],
      true,
    ]);
    const components = [
      createComponent('my-pending-component', ComponentBuildState.enabled),
      createComponent('my-ready-component', ComponentBuildState.enabled),
    ];
    const results = renderHook(() => usePACStatesForComponents(components)).result.current;

    expect(results['my-ready-component']).toBe(PACState.ready);
    expect(results['my-pending-component']).toBe(PACState.pending);
  });

  it('should identify ready for migrated component and pending states', () => {
    useK8sWatchResourceMock.mockReturnValue([
      [
        {
          metadata: {
            name: 'test',
            creationTimestamp: '2023-03-25T00:00:00Z',
            labels: { [PipelineRunLabel.COMPONENT]: 'my-ready-component' },
          },
        },
      ],
      true,
    ]);
    const components = [
      createComponent('my-pending-component', ComponentBuildState.enabled),
      createComponent(
        'my-ready-component',
        ComponentBuildState.enabled,
        undefined,
        undefined,
        true,
      ),
    ];
    const results = renderHook(() => usePACStatesForComponents(components)).result.current;

    expect(results['my-ready-component']).toBe(PACState.ready);
    expect(results['my-pending-component']).toBe(PACState.pending);

    // Add validation that configuration-time from migration path is used
    const migratedComponent = components[1];
    const configTime = getConfigurationTime(migratedComponent);
    expect(configTime).toBe('Wed, 21 Jan 2023 19:36:25 UTC');
  });

  it('should look for additional Tekton results via getNextPage', () => {
    const getNextPageMock = jest.fn();
    useTRPipelineRunsMock.mockReturnValueOnce([[], true, undefined, getNextPageMock]);
    useK8sWatchResourceMock.mockReturnValue([[], true]);

    const components = [createComponent('my-pending-component', ComponentBuildState.enabled)];
    const results = renderHook(() => usePACStatesForComponents(components)).result.current;
    expect(results['my-pending-component']).toBe(PACState.pending);
    expect(getNextPageMock).toHaveBeenCalled();
  });
});
