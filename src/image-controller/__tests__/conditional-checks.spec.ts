import { getKonfluxPublicInfo } from '~/hooks/useKonfluxPublicInfo';
import { checkIfImageControllerIsEnabled } from '../conditional-checks';

jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  getKonfluxPublicInfo: jest.fn(),
}));

const getKonfluxPublicInfoMock = getKonfluxPublicInfo as jest.Mock;

describe('checkIfImageControllerIsEnabled', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when image controller is enabled', async () => {
    getKonfluxPublicInfoMock.mockResolvedValue({
      integrations: {
        image_controller: {
          enabled: true,
        },
      },
    });

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(true);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });

  it('should return false when image controller is disabled', async () => {
    getKonfluxPublicInfoMock.mockResolvedValue({
      integrations: {
        image_controller: {
          enabled: false,
        },
      },
    });

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(false);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });

  it('should return false when image controller config is missing', async () => {
    getKonfluxPublicInfoMock.mockResolvedValue({
      integrations: {},
    });

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(false);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });

  it('should return false when integrations config is missing', async () => {
    getKonfluxPublicInfoMock.mockResolvedValue({});

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(false);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });

  it('should return false when image_controller.enabled is undefined', async () => {
    getKonfluxPublicInfoMock.mockResolvedValue({
      integrations: {
        image_controller: {},
      },
    });

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(false);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });

  it('should return false when image_controller.enabled is null', async () => {
    getKonfluxPublicInfoMock.mockResolvedValue({
      integrations: {
        image_controller: {
          enabled: null,
        },
      },
    });

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(false);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });

  it('should return false when getKonfluxPublicInfo throws an error', async () => {
    getKonfluxPublicInfoMock.mockRejectedValue(new Error('Failed to fetch config'));

    const result = await checkIfImageControllerIsEnabled();

    expect(result).toBe(false);
    expect(getKonfluxPublicInfoMock).toHaveBeenCalled();
  });
});
