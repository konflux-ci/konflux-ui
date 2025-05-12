import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import * as formik from 'formik';
import { useSnapshotsForApplication } from '../../../../../hooks/useSnapshots';
import { formikRenderer } from '../../../../../utils/test-utils';
import { SnapshotDropdown } from '../SnapshotDropdown';

jest.mock('../../../../../hooks/useSnapshots', () => ({
  useSnapshotsForApplication: jest.fn(),
}));

const useSnapshotsMock = useSnapshotsForApplication as jest.Mock;

describe('SnapshotDropdown', () => {
  beforeEach(() => {});

  it('should show loading indicator if snapshot arent loaded', () => {
    useSnapshotsMock.mockReturnValue({ data: [], isLoading: true });
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    expect(screen.getByText('Loading snapshots...')).toBeVisible();
  });

  it('should show dropdown if snapshots are loaded', async () => {
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
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'snapshot1' })).toBeVisible();
      expect(screen.getByRole('menuitem', { name: 'snapshot2' })).toBeVisible();
    });
  });

  it('should only show dropdowns related to the correct application', async () => {
    useSnapshotsMock.mockReturnValue({
      data: [{ metadata: { name: 'snapshot1' }, spec: { application: 'app' } }],
      isLoading: false,
    });
    formikRenderer(<SnapshotDropdown applicationName="app" name="snapshot" />, {
      targets: { application: 'app' },
    });
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));

    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'snapshot1' })).toBeVisible();
      expect(screen.queryByRole('menuitem', { name: 'snapshot2' })).not.toBeInTheDocument();
    });
  });

  it('should change the Snapshot dropdown value', async () => {
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
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));
    await act(() => fireEvent.click(screen.getByText('snapshot2')));
    await waitFor(() => {
      expect(screen.getByText('snapshot2'));
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

    formik.useField;

    useSnapshotsMock.mockReturnValue({
      data: [
        { metadata: { name: 'snapshot1' }, spec: { application: 'app' } },
        { metadata: { name: 'snapshot2' }, spec: { application: 'app' } },
      ],
      isLoading: false,
    });

    // Render with initial applicationName
    const { rerender } = formikRenderer(
      <SnapshotDropdown applicationName="app" name="snapshot" />,
      {
        targets: { application: 'app' },
      },
    );

    // Click the snapshot select toggle
    await act(() => fireEvent.click(screen.getByTestId('dropdown-toggle')));

    await waitFor(() => {
      // Placeholder text
      expect(screen.getByTestId('dropdown-toggle').textContent).toEqual('Select snapshot');
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
      expect(screen.getByText('Select snapshot'));
    });
  });
});
