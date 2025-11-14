import { render } from '@testing-library/react';
import { LoadingSkeleton } from '../LoadingSkeleton';

describe('LoadingSkeleton', () => {
  it('renders the given count of skeleton items', () => {
    const { container } = render(<LoadingSkeleton count={3} />);
    const items = container.querySelectorAll('.pf-v5-c-skeleton');
    expect(items.length).toBe(3);
  });

  it('applies widths for each skeleton item', () => {
    const { container } = render(<LoadingSkeleton count={2} widths={['50%', '25%']} />);
    const items = Array.from(container.querySelectorAll('.pf-v5-c-skeleton'));
    expect(items[0].getAttribute('style')).toContain('--pf-v5-c-skeleton--Width: 50%');
    expect(items[1].getAttribute('style')).toContain('--pf-v5-c-skeleton--Width: 25%');
  });

  it('renders grid layout when direction is grid', () => {
    const { container } = render(<LoadingSkeleton count={4} direction="grid" columns={4} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(getComputedStyle(wrapper).display).toBe('grid');
  });
});
