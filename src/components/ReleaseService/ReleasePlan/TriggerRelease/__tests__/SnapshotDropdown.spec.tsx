import { screen } from '@testing-library/react';
import { useSnapshotsForApplication } from '../../../../../hooks/useSnapshots';
import { formikRenderer } from '../../../../../utils/test-utils';
import { SnapshotDropdown } from '../SnapshotDropdown';

jest.mock('../../../../../hooks/useSnapshots', () => ({
  useSnapshotsForApplication: jest.fn(),
}));

const useSnapshotsMock = useSnapshotsForApplication as jest.Mock;

describe('SnapshotDropdown', () => {
  beforeEach(() => {});

  it('should change the Snapshot dropdown value', () => {
    useSnapshotsMock.mockReturnValue({
      data: [
        { metadata: { name: 'snapshot1' }, spec: { application: 'app' } },
        { metadata: { name: 'snapshot2' }, spec: { application: 'app' } },
      ],
      isLoading: false,
    });

    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    expect(screen.queryByRole('button')).toBeInTheDocument();
  });
});
