import { renderHook } from '@testing-library/react-hooks';
import { usePipelineRunsForCommitV2 } from '~/hooks/usePipelineRunsV2';
import { pipelineWithCommits } from '../__data__/pipeline-with-commits';
import { useCommitStatus } from '../commit-status';

jest.mock('~/hooks/usePipelineRunsV2', () => ({
  usePipelineRunsForCommitV2: jest.fn(),
}));

const usePipelineRunsForCommitV2Mock = usePipelineRunsForCommitV2 as jest.Mock;

describe('useCommitStatus', () => {
  it('returns Pending status if pipelineruns are not loaded', () => {
    usePipelineRunsForCommitV2Mock.mockReturnValue([
      null,
      false,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    const { result } = renderHook(() => useCommitStatus('app', 'commit'));
    expect(result.current).toEqual(['Pending', false, undefined]);
  });

  it('returns Pending status if pipelineruns for given commit are not found', () => {
    usePipelineRunsForCommitV2Mock.mockReturnValue([
      [],
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    const { result } = renderHook(() => useCommitStatus('app', 'commit123'));
    expect(result.current).toEqual(['Pending', true, undefined]);
  });

  it('returns correct status if pipelineruns are loaded', () => {
    usePipelineRunsForCommitV2Mock.mockReturnValue([
      pipelineWithCommits.filter(
        (p) => p.metadata.labels['pipelinesascode.tekton.dev/sha'] === 'commit14rt',
      ),
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    const { result } = renderHook(() => useCommitStatus('purple-mermaid-app', 'commit14rt'));
    expect(result.current).toEqual(['Pending', true, undefined]);
  });

  it('returns status from the latest started pipelinerun', () => {
    usePipelineRunsForCommitV2Mock.mockReturnValue([
      pipelineWithCommits.filter(
        (p) => p.metadata.labels['pipelinesascode.tekton.dev/sha'] === 'commit123',
      ),
      true,
      undefined,
      undefined,
      { hasNextPage: false, isFetchingNextPage: false },
    ]);
    const { result } = renderHook(() => useCommitStatus('purple-mermaid-app', 'commit123'));
    expect(result.current).toEqual(['Failed', true, undefined]);
  });
});
