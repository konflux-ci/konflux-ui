import { act, fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { ContextSwitcher } from './ContextSwitcher';

jest.mock('../../hooks/useLocalStorage', () => ({
  useLocalStorage: jest.fn(() => [{}, jest.fn()]),
}));

const localStorageMock = useLocalStorage as jest.Mock;

describe('ContextSwitcher', () => {
  it('should render context switcher component', () => {
    render(<ContextSwitcher menuItems={[]} resourceType="application" footer={<>footer text</>} />);
    act(() => screen.getByRole('button').click());

    expect(screen.getByPlaceholderText('Filter application by name')).toBeInTheDocument();
    expect(screen.getByText('Recent')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('footer text')).toBeInTheDocument();
  });

  it('should show currently selected item', () => {
    const item = { name: 'Test item', key: 'test' };
    render(<ContextSwitcher menuItems={[item]} selectedItem={item} />);
    act(() => screen.getByRole('button').click());

    const selectedItem = screen.getByRole('menuitem');
    expect(selectedItem).toHaveClass('pf-m-selected');
  });

  it('should close menu when item is selected', () => {
    const items = [
      { name: 'Test 1', key: 'test1' },
      { name: 'Test 2', key: 'test2' },
    ];
    const callback = jest.fn();
    render(<ContextSwitcher menuItems={items} onSelect={callback} />);
    act(() => screen.getByRole('button').click());

    act(() => screen.getByText('Test 1').click());
    expect(callback).toHaveBeenCalledWith({ name: 'Test 1', key: 'test1' });
    expect(screen.queryByText('Test 1')).toBeNull();
  });

  it('should allow filtering items', () => {
    const items = [
      { name: 'Test 1', key: 'test1' },
      { name: 'Test 2', key: 'test2' },
      { name: 'Test 3', key: 'test3' },
    ];
    const callback = jest.fn();
    render(<ContextSwitcher menuItems={items} onSelect={callback} />);
    act(() => screen.getByRole('button').click());

    act(() => {
      fireEvent.input(screen.getByPlaceholderText('Filter resource by name'), {
        target: { value: '2' },
      });
    });
    expect(screen.queryByText('Test 2')).toBeInTheDocument();
    expect(screen.queryByText('Test 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test 3')).not.toBeInTheDocument();
  });

  it('should use recent items from localStorage', () => {
    const items = [
      { name: 'Test 1', key: 'test1' },
      { name: 'Test 2', key: 'test2' },
      { name: 'Test 3', key: 'test3' },
    ];
    const setStorageMock = jest.fn();
    localStorageMock.mockReturnValue([
      { recentItems: { resource: ['test2', 'test3'] } },
      setStorageMock,
    ]);
    render(<ContextSwitcher menuItems={items} />);
    act(() => screen.getByRole('button').click());

    act(() => screen.getByText('Recent').click());
    expect(setStorageMock).toHaveBeenCalledWith(
      expect.objectContaining({ lastTab: { resource: 0 } }),
    );

    act(() => screen.getByText('Test 1').click());
    expect(setStorageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recentItems: { resource: ['test1', 'test2', 'test3'] },
      }),
    );
  });

  it('should render items with visibility icons', () => {
    const items = [
      { name: 'Public Item', key: 'public', visibility: 'public' },
      { name: 'Private Item', key: 'private', visibility: 'private' },
      { name: 'No Visibility Item', key: 'none' },
    ];
    render(<ContextSwitcher menuItems={items} />);
    act(() => screen.getByRole('button').click());

    // Verify public item shows lock-open icon
    const publicItem = screen.getByText('Public Item').closest('[role="menuitem"]');
    expect(publicItem).toContainElement(publicItem?.querySelector('svg[role="img"]'));

    // Verify private item shows lock icon
    const privateItem = screen.getByText('Private Item').closest('[role="menuitem"]');
    expect(privateItem).toContainElement(privateItem?.querySelector('svg[role="img"]'));

    // Verify no visibility item has no icon
    const noVisibilityItem = screen.getByText('No Visibility Item').closest('[role="menuitem"]');
    expect(noVisibilityItem?.querySelectorAll('svg').length).toBe(0);
  });

  it('should handle items with visibility correctly', () => {
    const items = [
      { name: 'Public Item', key: 'public', visibility: 'public' },
      { name: 'Private Item', key: 'private', visibility: 'private' },
      { name: 'No Visibility Item', key: 'none' },
    ];
    render(<ContextSwitcher menuItems={items} />);
    act(() => screen.getByRole('button').click());

    // Check that all items are rendered
    expect(screen.getByText('Public Item')).toBeInTheDocument();
    expect(screen.getByText('Private Item')).toBeInTheDocument();
    expect(screen.getByText('No Visibility Item')).toBeInTheDocument();

    // Check that visibility icons are present
    const lockOpenIcons = screen
      .getAllByRole('img', { hidden: true })
      .filter((svg) => svg.getAttribute('viewBox') === '0 0 576 512');
    const lockIcons = screen
      .getAllByRole('img', { hidden: true })
      .filter((svg) => svg.getAttribute('viewBox') === '0 0 448 512');

    expect(lockOpenIcons.length).toBeGreaterThan(0);
    expect(lockIcons.length).toBeGreaterThan(0);
  });

  it('should filter items with visibility correctly', () => {
    const items = [
      { name: 'Public Test', key: 'public', visibility: 'public' },
      { name: 'Private Test', key: 'private', visibility: 'private' },
      { name: 'Other Item', key: 'other' },
    ];
    render(<ContextSwitcher menuItems={items} />);
    act(() => screen.getByRole('button').click());

    // Filter by 'Test' - should show both public and private items
    act(() => {
      fireEvent.input(screen.getByPlaceholderText('Filter resource by name'), {
        target: { value: 'Test' },
      });
    });

    expect(screen.getByText('Public Test')).toBeInTheDocument();
    expect(screen.getByText('Private Test')).toBeInTheDocument();
    expect(screen.queryByText('Other Item')).not.toBeInTheDocument();
  });
});
