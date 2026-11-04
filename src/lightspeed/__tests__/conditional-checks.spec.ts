import { checkIfLightspeedIsAvailable } from '~/lightspeed/conditional-checks';
import { getLightspeedClient } from '~/lightspeed/lightspeedClient';

jest.mock('~/lightspeed/lightspeedClient', () => ({
  getLightspeedClient: jest.fn(),
}));

jest.mock('~/feature-flags/utils', () => ({
  ensureConditionIsOn: jest.fn(() => jest.fn()),
}));

const mockGetLightspeedClient = getLightspeedClient as jest.MockedFunction<
  typeof getLightspeedClient
>;

describe('checkIfLightspeedIsAvailable', () => {
  const healthCheck = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetLightspeedClient.mockReturnValue({ healthCheck } as never);
  });

  it('returns true when Lightspeed reports healthy, alive, and ready', async () => {
    healthCheck.mockResolvedValue({
      status: 'healthy',
      alive: true,
      ready: true,
      reason: 'ok',
      timestamp: '2026-01-01T00:00:00Z',
    });

    await expect(checkIfLightspeedIsAvailable()).resolves.toBe(true);
    expect(healthCheck).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('returns false when Lightspeed is unhealthy', async () => {
    healthCheck.mockResolvedValue({
      status: 'unhealthy',
      alive: true,
      ready: false,
      reason: 'not ready',
      timestamp: '2026-01-01T00:00:00Z',
    });

    await expect(checkIfLightspeedIsAvailable()).resolves.toBe(false);
  });

  it('returns false when the health check throws', async () => {
    healthCheck.mockRejectedValue(new Error('network error'));

    await expect(checkIfLightspeedIsAvailable()).resolves.toBe(false);
  });
});
