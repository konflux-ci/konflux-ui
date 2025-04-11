import { screen, waitFor } from '@testing-library/react';
import { useSnapshots } from '../../../../../hooks/useSnapshots';
import { formikRenderer } from '../../../../../utils/test-utils';
import { SnapshotDropdown } from '../SnapshotDropdown';

jest.mock('../../../../../hooks/useSnapshots', () => ({
  useSnapshots: jest.fn(),
}));

const useSnapshotsMock = useSnapshots as jest.Mock;

describe('SnapshotDropdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading indicator if snapshots are not loaded', () => {
    useSnapshotsMock.mockReturnValue([[], false, null]);
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    expect(screen.getByPlaceholderText('Loading snapshots...')).toBeInTheDocument();
  });

  it('should handle empty snapshots gracefully', async () => {
    useSnapshotsMock.mockReturnValue([[], true, null]);
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Select snapshot')).toBeInTheDocument();
      expect(screen.queryByRole('option')).not.toBeInTheDocument();
    });
  });
});
