import { renderHook } from '@testing-library/react-hooks';
import { useComponents } from '../../../../../../../hooks/useComponents';
import { useLatestIntegrationTestPipelines } from '../../../../../../../hooks/useLatestIntegrationTestPipelines';
import {
  createK8sWatchResourceMock,
  createUseWorkspaceInfoMock,
} from '../../../../../../../utils/test-utils';
import { mockIntegrationTestScenariosData } from '../../../../../__data__';
import { testPipelineRuns } from '../__data__/test-pipeline-data';
import { useAppApplicationTestNodes } from '../useAppApplicationTestNodes';

jest.mock('../../../../../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
}));
jest.mock('../../../../../../../hooks/useLatestIntegrationTestPipelines', () => ({
  useLatestIntegrationTestPipelines: jest.fn(),
}));
jest.mock('../../../../../../../hooks/useTektonResults');

const useK8sWatchResourceMock = createK8sWatchResourceMock();
const useComponentsMock = useComponents as jest.Mock;
const useLatestIntegrationTestPipelinesMock = useLatestIntegrationTestPipelines as jest.Mock;

describe('useAppApplicationTestNodes', () => {
  createUseWorkspaceInfoMock({ namespace: 'test-ns', workspace: 'test-ws' });
  beforeEach(() => {
    useK8sWatchResourceMock.mockReset();
    useK8sWatchResourceMock.mockReturnValue([mockIntegrationTestScenariosData, true]);
    useLatestIntegrationTestPipelinesMock.mockReturnValue([testPipelineRuns, true]);
    useComponentsMock.mockReturnValue([[], true]);
  });

  it('should return integration test nodes', () => {
    const { result } = renderHook(() =>
      useAppApplicationTestNodes('test-ns', 'test-dev-samples', [], false),
    );
    const [nodes, appTests, resources, loaded] = result.current;

    expect(nodes).toHaveLength(4);
    expect(appTests).toHaveLength(0);
    expect(resources).toHaveLength(4);
    expect(loaded).toBe(true);
  });

  it('should return failed status', () => {
    const failedPipelinerun = testPipelineRuns[0];
    useK8sWatchResourceMock.mockReset();

    useK8sWatchResourceMock
      .mockReturnValueOnce([[mockIntegrationTestScenariosData[0]], true])
      .mockReturnValueOnce([[failedPipelinerun], true]);

    const { result } = renderHook(() =>
      useAppApplicationTestNodes('test-ns', 'test-dev-samples', [], false),
    );

    const [nodes] = result.current;

    expect(nodes[0].data.status).toBe('Failed');
  });

  it('should return status from latest pipelinerun', () => {
    const { result } = renderHook(() =>
      useAppApplicationTestNodes('test-ns', 'test-dev-samples', [], false),
    );
    const [nodes] = result.current;
    expect(nodes[1].data.status).toBe('Succeeded');
  });
});
