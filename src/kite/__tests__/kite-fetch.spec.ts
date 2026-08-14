import { commonFetchJSON } from '~/k8s';
import { createMockIssue } from '~/unit-test-utils/mock-issues';
import { PLUGIN_KITE } from '../const';
import { IssueState } from '../issue-type';
import { resolveIssue } from '../kite-fetch';

jest.mock('~/k8s', () => ({
  ...jest.requireActual('~/k8s'),
  commonFetchJSON: jest.fn(),
}));

const mockCommonFetchJSON = commonFetchJSON as jest.MockedFunction<typeof commonFetchJSON>;

describe('resolveIssue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should POST to the resolve endpoint with namespace', async () => {
    const resolved = createMockIssue({ state: IssueState.RESOLVED });
    mockCommonFetchJSON.mockResolvedValue(resolved);

    const result = await resolveIssue('issue-123', 'test-ns');

    expect(mockCommonFetchJSON).toHaveBeenCalledWith(
      '/api/v1/issues/issue-123/resolve?namespace=test-ns',
      { method: 'POST', pathPrefix: PLUGIN_KITE },
    );
    expect(result).toEqual(resolved);
  });

  it('should POST to the resolve endpoint without namespace', async () => {
    const resolved = createMockIssue({ state: IssueState.RESOLVED });
    mockCommonFetchJSON.mockResolvedValue(resolved);

    await resolveIssue('issue-123');

    expect(mockCommonFetchJSON).toHaveBeenCalledWith('/api/v1/issues/issue-123/resolve', {
      method: 'POST',
      pathPrefix: PLUGIN_KITE,
    });
  });

  it('should propagate request failures', async () => {
    const error = new Error('Network error');
    mockCommonFetchJSON.mockRejectedValue(error);

    await expect(resolveIssue('issue-123')).rejects.toBe(error);
  });
});
