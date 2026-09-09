import { act, configure, fireEvent, screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { SegmentedToggle } from '../SegmentedToggle';

configure({ testIdAttribute: 'id' });

describe('SegmentedToggle', () => {
  it('should render options and call onChange when an option is selected', () => {
    const onChange = jest.fn();

    renderWithQueryClientAndRouter(
      <SegmentedToggle
        aria-label="Example toggle"
        value="a"
        onChange={onChange}
        options={[
          { value: 'a', label: 'Option A', id: 'option-a' },
          { value: 'b', label: 'Option B', tooltip: 'Option B tooltip', id: 'option-b' },
        ]}
      />,
    );

    expect(screen.getByRole('group', { name: 'Example toggle' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Option A' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Option B' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Option B' }));
    expect(onChange).toHaveBeenCalledWith('b');

    act(() => {
      fireEvent.mouseEnter(screen.getByRole('button', { name: 'Option B' }));
    });
    expect(screen.getByText('Option B tooltip')).toBeInTheDocument();
  });
});
