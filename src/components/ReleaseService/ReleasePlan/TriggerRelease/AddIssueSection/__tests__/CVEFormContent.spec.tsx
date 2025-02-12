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
      screen.getByText('Provide information about a CVE that has already been resolved.'),
    ).toBeVisible();
  });

  it('should show correct input fields ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />);
    expect(screen.getByRole('textbox', { name: 'CVE ID' })).toBeVisible();
  });

  it('should show correct values', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      components: [
        { name: 'a', packages: ['p1', 'p2', 'p3'] },
        { name: 'b', packages: ['p1', 'p2', 'p3'] },
      ],
    });
    expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'CVE ID' }).value).toBe('CVE-120');
  });

  it('should render component fields ', async () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      components: [
        { name: 'a', packages: ['p1', 'p2', 'p3'] },
        { name: 'b', packages: ['p1', 'p2', 'p3'] },
      ],
    });
    screen.getByTestId('component-field');
    await waitFor(() => {
      expect(screen.getByTestId('component-0')).toBeInTheDocument();
      expect(screen.getByTestId('component-1')).toBeInTheDocument();
    });
  });

  it('should remove component fields ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      components: [
        { name: 'a', packages: ['p1', 'p2', 'p3'] },
        { name: 'b', packages: ['p1', 'p2', 'p3'] },
      ],
    });
    screen.getByTestId('component-field');
    expect(screen.queryByTestId('component-0')).toBeInTheDocument();
    expect(screen.queryByTestId('component-1')).toBeInTheDocument();

    act(() => {
      fireEvent.click(screen.queryByTestId('remove-component-0'));
    });
    expect(screen.queryByTestId('component-0')).toBeInTheDocument();
    expect(screen.queryByTestId('component-1')).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('component-0').getElementsByClassName('pf-v5-c-dropdown__toggle-text')[0]
        .innerHTML,
    ).toBe('b');
  });

  it('should have disabled Submit button when ID not there', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />);
    expect(screen.getByTestId('add-cve-btn')).toBeDisabled();
  });

  it('should render multiple packages ', () => {
    formikRenderer(<CVEFormContent modalToggle={null} />, {
      key: 'CVE-120',
      components: [
        { name: 'a', packages: ['p1', 'p2', 'p3'] },
        { name: 'b', packages: ['p3', 'p4', 'p3'] },
      ],
    });
    screen.getByTestId('component-field');
    expect(screen.getByTestId<HTMLInputElement>('cmp-0-pac-0').value).toBe('p1');
    expect(screen.getByTestId<HTMLInputElement>('cmp-1-pac-0').value).toBe('p3');
  });
});
