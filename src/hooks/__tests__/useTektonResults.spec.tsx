/* eslint-disable max-nested-callbacks */
// import { QueryClientProvider } from '@tanstack/react-query';
// import { act, renderHook as rtlRenderHook } from '@testing-library/react-hooks';
import { renderHook } from '@testing-library/react-hooks';
import { PipelineRunModel } from '../../models';
import { TaskRunKind } from '../../types';
import {
  // TektonResultsOptions,
  getPipelineRuns,
  getTaskRuns,
  // RecordsList,
  getTaskRunLog,
} from '../../utils/tekton-results';
// import { createTestQueryClient } from '../../utils/test-utils';
import { useTRPipelineRuns, useTRTaskRunLog, useTRTaskRuns } from '../useTektonResults';

jest.mock('../../components/Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(() => ({ namespace: 'test-ns', workspace: 'test-ws' })),
}));

jest.mock('../../utils/tekton-results');

// const mockResponse = [
//   [{ metadata: { name: 'first' } }, { metadata: { name: 'second' } }],
//   { nextPageToken: 'next-token' },
// ] as [unknown[], RecordsList];

// const mockResponseNext = [
//   [{ metadata: { name: 'third' } }, { metadata: { name: 'fourth' } }],
//   {},
// ] as [unknown[], RecordsList];

const getPipelineRunsMock = getPipelineRuns as jest.Mock;
const getTaskRunsMock = getTaskRuns as jest.Mock;
const getTaskRunLogMock = getTaskRunLog as jest.Mock;

describe('useTektonResults', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  [
    {
      describeTitle: 'useTRPipelineRuns',
      name: 'pipeline',
      getRunsMock: getPipelineRunsMock,
      useTestHook: useTRPipelineRuns,
    },
    {
      describeTitle: 'useTRTaskRuns',
      name: 'task',
      getRunsMock: getTaskRunsMock,
      useTestHook: useTRTaskRuns,
    },
  ].forEach(({ describeTitle, name, getRunsMock, useTestHook }) => {
    describe(describeTitle, () => {
      it(`should not attempt to get ${name} runs`, () => {
        renderHook(() => useTestHook(null, null));
        expect(getRunsMock).not.toHaveBeenCalled();
      });
      // [TODO]: Do we need hooks for the new hook using useInfiniteQuery hook?
      // it(`should return ${name} runs`, async () => {
      //   getRunsMock.mockReturnValue(mockResponseNext);
      //   const { result, waitFor } = renderHook(() => useTestHook('test-ns'));
      //   expect(getRunsMock).toHaveBeenCalledWith('test-ws', 'test-ns', undefined, null, undefined);
      //   expect(result.current).toEqual([[], false, undefined, undefined]);
      //   await waitFor(() => result.current[1]);
      //   expect(result.current).toEqual([mockResponseNext[0], true, undefined, undefined]);
      // });

      // it('should return pass along filters and cache key', async () => {
      //   getRunsMock.mockClear();
      //   getRunsMock.mockReturnValue(mockResponseNext);
      //   const filter: TektonResultsOptions = {
      //     filter: 'foo=bar',
      //   };
      //   const { result, waitFor } = renderHook(() =>
      //     useTestHook('test-ns', filter, ),
      //   );
      //   expect(getRunsMock).toHaveBeenCalledWith(
      //     'test-ws',
      //     'test-ns',
      //     filter,
      //     null,
      //   );
      //   expect(result.current).toEqual([[], false, undefined, undefined]);
      //   await waitFor(() => result.current[1]);
      //   expect(result.current).toEqual([mockResponseNext[0], true, undefined, undefined]);
      // });

      // it('should return pass along cache key', async () => {
      //   getRunsMock.mockClear();
      //   getRunsMock.mockReturnValue(mockResponseNext);
      //   const { result, waitFor } = renderHook(() =>
      //     useTestHook('test-ns', undefined, ),
      //   );
      //   expect(getRunsMock).toHaveBeenCalledWith(
      //     'test-ws',
      //     'test-ns',
      //     undefined,
      //     null,
      //   );
      //   expect(result.current).toEqual([[], false, undefined, undefined]);
      //   await waitFor(() => result.current[1]);
      //   expect(result.current).toEqual([mockResponseNext[0], true, undefined, undefined]);
      // });

      // it(`should return function to get next ${name} runs`, async () => {
      //   getRunsMock.mockReturnValueOnce(mockResponse).mockReturnValueOnce(mockResponseNext);
      //   const { result, waitFor } = renderHook(() => useTestHook('test-ns'));
      //   expect(getRunsMock).toHaveBeenCalledWith('test-ws', 'test-ns', undefined, null, undefined);
      //   expect(result.current).toEqual([[], false, undefined, undefined]);
      //   await waitFor(() => result.current[1]);
      //   expect(result.current).toEqual([mockResponse[0], true, undefined, expect.any(Function)]);

      //   getRunsMock.mockClear();

      //   // call to get next set
      //   act(() => {
      //     expect(result.current[3]()).toBe(true);
      //   });

      //   expect(getRunsMock).toHaveBeenCalledWith(
      //     'test-ws',
      //     'test-ns',
      //     undefined,
      //     'next-token',
      //     undefined,
      //   );

      //   // subsequent calls should fail
      //   expect(result.current[3]()).toBe(false);

      //   await waitFor(() => result.current[0].length > 2);

      //   expect(result.current).toEqual([
      //     [...mockResponse[0], ...mockResponseNext[0]],
      //     true,
      //     undefined,
      //     undefined,
      //   ]);
      // });

      // it('should return error when exception thrown', () => {
      //   const error = {};
      //   getRunsMock.mockImplementation(() => {
      //     throw error;
      //   });
      //   const { result } = renderHook(() => useTestHook('test-ns'));
      //   expect(getRunsMock).toHaveBeenCalledWith('test-ws', 'test-ns', undefined, null, undefined);
      //   expect(result.current).toEqual([[], true, error, undefined]);
      // });

      // it('should return error when exception thrown when getting next page', async () => {
      //   getRunsMock.mockReturnValueOnce(mockResponse);
      //   const { result, waitFor } = renderHook(() => useTestHook('test-ns'));
      //   expect(getRunsMock).toHaveBeenCalledWith('test-ws', 'test-ns', undefined, null, undefined);
      //   expect(result.current).toEqual([[], false, undefined, undefined]);
      //   await waitFor(() => result.current[1]);
      //   expect(result.current).toEqual([mockResponse[0], true, undefined, expect.any(Function)]);

      //   getRunsMock.mockClear();

      //   const error = {};
      //   getRunsMock.mockImplementation(() => {
      //     throw error;
      //   });

      //   act(() => {
      //     expect(result.current[3]()).toBe(true);
      //   });

      //   expect(getRunsMock).toHaveBeenCalledWith(
      //     'test-ws',
      //     'test-ns',
      //     undefined,
      //     'next-token',
      //     undefined,
      //   );
      //   expect(result.current).toEqual([mockResponse[0], true, error, undefined]);
      // });
    });
  });

  const mockTR = {
    metadata: {
      name: 'sample-task-run',
      uid: 'sample-task-run-id',
      ownerReferences: [
        { kind: PipelineRunModel.kind, uid: 'sample-pipeline-run-id', name: 'sample-pipeline-run' },
      ],
    },
  } as TaskRunKind;

  describe('useTRTaskRunLog', () => {
    it('should not attempt to get task run log', () => {
      renderHook(() => useTRTaskRunLog(null, null));
      expect(getTaskRunLogMock).not.toHaveBeenCalled();

      renderHook(() => useTRTaskRunLog('test-ns', null));
      expect(getTaskRunLogMock).not.toHaveBeenCalled();

      renderHook(() => useTRTaskRunLog(null, mockTR));
      expect(getTaskRunLogMock).not.toHaveBeenCalled();
    });

    it('should return task run log', async () => {
      getTaskRunLogMock.mockReturnValue('sample log');
      const { result, waitFor } = renderHook(() => useTRTaskRunLog('test-ns', mockTR));
      expect(getTaskRunLogMock).toHaveBeenCalledWith(
        'test-ws',
        'test-ns',
        'sample-task-run-id',
        'sample-pipeline-run-id',
      );
      expect(result.current).toEqual([null, false, undefined]);
      await waitFor(() => result.current[1]);
      expect(result.current).toEqual(['sample log', true, undefined]);
    });

    it('should return error when exception thrown', () => {
      const error = {};
      getTaskRunLogMock.mockImplementation(() => {
        throw error;
      });
      const { result } = renderHook(() => useTRTaskRunLog('test-ns', mockTR));
      expect(getTaskRunLogMock).toHaveBeenCalledWith(
        'test-ws',
        'test-ns',
        'sample-task-run-id',
        'sample-pipeline-run-id',
      );
      expect(result.current).toEqual([null, false, error]);
    });
  });
});
