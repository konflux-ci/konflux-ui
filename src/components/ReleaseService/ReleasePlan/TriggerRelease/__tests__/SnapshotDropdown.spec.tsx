import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import * as formik from 'formik';
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

  it('should show dropdown if snapshots are loaded', async () => {
    useSnapshotsMock.mockReturnValue([
      [
        { metadata: { name: 'snapshot1' }, spec: { application: 'app' } },
        { metadata: { name: 'snapshot2' }, spec: { application: 'app' } },
      ],
      true,
      null,
    ]);
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    await act(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Options menu', hidden: true })),
    );

    expect(screen.getByRole('option', { name: 'snapshot1' })).toBeVisible();
    expect(screen.getByRole('option', { name: 'snapshot2' })).toBeVisible();
  });

  it('should only show dropdowns related to the correct application', async () => {
    useSnapshotsMock.mockReturnValue([
      [
        { metadata: { name: 'snapshot1' }, spec: { application: 'app' } },
        { metadata: { name: 'snapshot2' }, spec: { application: 'app2' } },
      ],
      true,
      null,
    ]);
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    await act(() =>
      fireEvent.click(screen.getByRole('button', { name: 'Options menu', hidden: true })),
    );

    expect(screen.queryByRole('menuitem', { name: 'snapshot2' })).not.toBeInTheDocument();
  });

  it('should change the Snapshot dropdown value', async () => {
    useSnapshotsMock.mockReturnValue([
      [
        { metadata: { name: 'snapshot1' }, spec: { application: 'app' } },
        { metadata: { name: 'snapshot2' }, spec: { application: 'app' } },
      ],
      true,
      null,
    ]);

    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    expect(screen.queryByRole('button')).toBeInTheDocument();

    await act(() => fireEvent.click(screen.getByRole('button')));

    await waitFor(() => {
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Select snapshot')).toBeInTheDocument();
      expect(screen.getByText('snapshot1')).toBeInTheDocument();
    });
    await act(() => fireEvent.click(screen.getByText('snapshot2')));
    await waitFor(() => {
      expect(screen.getByDisplayValue('snapshot2')).toBeInTheDocument();
    });
  });

  it('should reset the dropdown when applicationName changes', async () => {
    const setValueMock = jest.fn();

    // Mock the useField hook to track setValue call
    jest
      .spyOn(formik, 'useField')
      .mockReturnValue([
        {} as formik.FieldInputProps<unknown>,
        {} as formik.FieldMetaProps<unknown>,
        { setValue: setValueMock } as unknown as formik.FieldHelperProps<unknown>,
      ]);

    useSnapshotsMock.mockReturnValue([
      [
        { metadata: { name: 'snapshot1' }, spec: { application: 'app' } },
        { metadata: { name: 'snapshot2' }, spec: { application: 'app' } },
      ],
      true,
      null,
    ]);

    // Render with initial applicationName
    const { rerender } = formikRenderer(
      <SnapshotDropdown applicationName="app" name="snapshot" />,
      {
        targets: { application: 'app' },
      },
    );

    // Snapshot select toggle
    expect(screen.queryByRole('button')).toBeInTheDocument();

    // Click the snapshot select toggle
    await act(() => fireEvent.click(screen.getByRole('button')));

    await waitFor(() => {
      // Snapshot dropdown menu
      expect(screen.getByRole('listbox')).toBeInTheDocument();
      // Placeholder text
      expect(screen.getByPlaceholderText('Select snapshot')).toBeInTheDocument();
    });
    await act(() =>
      // Select a snapshot value
      fireEvent.click(screen.getByText('snapshot2')),
    );

    // Re-render the component with a new applicationName to trigger the useEffect
    rerender(<SnapshotDropdown applicationName="new-app" name="snapshot" />);

    // Assert that setValue('') was called when applicationName changes
    expect(setValueMock).toHaveBeenCalledWith('');

    // Expect the snapshot dropdown to have placeholder text.
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Select snapshot')).toBeInTheDocument();
    });
  });

  it('should show error message if snapshots fail to load', () => {
    useSnapshotsMock.mockReturnValue([[], true, { message: 'Failed to load snapshots' }]);
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });

    expect(screen.getByText('Failed to load snapshots')).toBeInTheDocument();
  });
});
