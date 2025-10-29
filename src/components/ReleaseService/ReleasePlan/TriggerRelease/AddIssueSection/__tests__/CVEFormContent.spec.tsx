import { fireEvent, screen, act, waitFor } from '@testing-library/react';
import { createK8sWatchResourceMock, formikRenderer } from '../../../../../../utils/test-utils';
import CVEFormContent from '../CVEFormContent';

const watchMockResource = createK8sWatchResourceMock();

describe('CVEFormContent', () => {
  beforeEach(() => {
    watchMockResource.mockReturnValue([
      [{ metadata: { name: 'p1' } }, { metadata: { name: 'p2' } }, { metadata: { name: 'p3' } }],
      true,
    ]);
  });

  it('should show correct heading ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />);
    expect(
      screen.getByText(
        'Provide information about a Common Vulnerabilities and Exposures (CVE) entry that has already been addressed.',
      ),
    ).toBeVisible();
  });

  it('should show correct input fields ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />);
    expect(screen.getByRole('textbox', { name: 'CVE key' })).toBeVisible();
  });

  it('should show correct values', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      component: 'a',
      packages: ['p1', 'p2', 'p3'],
    });
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'CVE key' }).value).toBe(
      'CVE-120',
    );
  });

  it('should render package fields ', async () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      component: 'a',
      packages: ['p1', 'p2', 'p3'],
    });
    screen.getByTestId('component-field');
    await waitFor(() => {
      expect(screen.getAllByTestId('pac-0')).toHaveLength(2);
      expect(screen.getAllByTestId('pac-1')).toHaveLength(2);
      expect(screen.getAllByTestId('pac-2')).toHaveLength(2);
    });
  });

  it('should remove package fields ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      component: 'a',
      packages: ['p1', 'p2'],
    });
    screen.getByTestId('component-field');
    expect(screen.getAllByTestId('pac-0')).toHaveLength(2);
    expect(screen.getAllByTestId('pac-1')).toHaveLength(2);

    act(() => {
      fireEvent.click(screen.getAllByTestId('pac-0')[1]);
    });
    expect(screen.getAllByTestId('pac-0')).toHaveLength(2);
    expect(screen.queryAllByTestId('pac-1')).toHaveLength(0);
  });

  it('should have disabled Submit button when ID not there', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />);
    expect(screen.getByTestId('add-cve-btn')).toBeDisabled();
  });

  it('should render multiple packages ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      component: 'a',
      packages: ['p1', 'p2', 'p3'],
    });
    screen.getByTestId('component-field');
    expect(screen.getAllByTestId('pac-0')[0] as HTMLInputElement).toHaveValue('p1');
    expect(screen.getAllByTestId('pac-1')[0] as HTMLInputElement).toHaveValue('p2');
    expect(screen.getAllByTestId('pac-2')[0] as HTMLInputElement).toHaveValue('p3');
  });
});
