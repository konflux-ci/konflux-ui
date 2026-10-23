import { commonFetch } from '~/k8s';
import { checkIfKueueIsAvailable } from '../conditional-checks';
import { KUEUE_VISIBILITY_API_PATH } from '../const';

jest.mock('~/k8s', () => ({
  ...jest.requireActual('~/k8s'),
  commonFetch: jest.fn(),
}));

const mockCommonFetch = commonFetch as jest.MockedFunction<typeof commonFetch>;

describe('checkIfKueueIsAvailable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when the visibility API discovery endpoint responds successfully', async () => {
    mockCommonFetch.mockResolvedValue({ ok: true } as Response);

    const result = await checkIfKueueIsAvailable();

    expect(result).toBe(true);
    expect(mockCommonFetch).toHaveBeenCalledWith(KUEUE_VISIBILITY_API_PATH);
  });

  it('should return false when the visibility API group is not registered on the cluster', async () => {
    mockCommonFetch.mockRejectedValue(new Error('Not Found'));

    const result = await checkIfKueueIsAvailable();

    expect(result).toBe(false);
  });

  it('should return false when the request throws for any other reason (e.g. network error)', async () => {
    mockCommonFetch.mockRejectedValue(new Error('Network error'));

    const result = await checkIfKueueIsAvailable();

    expect(result).toBe(false);
  });
});
