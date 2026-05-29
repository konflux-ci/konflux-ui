import { screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import { ConformaSummaryBar } from '../ConformaSummaryBar';
import '@testing-library/jest-dom';

describe('ConformaSummaryBar', () => {
  const defaultProps = {
    totalComponents: 10,
    totalFailed: 3,
    totalViolations: 7,
    totalWarnings: 4,
    totalSuccesses: 20,
  };

  it('renders all five metric items', () => {
    routerRenderer(<ConformaSummaryBar {...defaultProps} />);

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Failed Components')).toBeInTheDocument();
    expect(screen.getByText('Violations')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Successes')).toBeInTheDocument();
  });

  it('displays correct counts for each metric', () => {
    const { container } = routerRenderer(<ConformaSummaryBar {...defaultProps} />);

    const strongElements = container.querySelectorAll('strong');
    const counts = Array.from(strongElements).map((el) => el.textContent);

    expect(counts).toContain('10');
    expect(counts).toContain('3');
    expect(counts).toContain('7');
    expect(counts).toContain('4');
    expect(counts).toContain('20');
  });

  it('renders with zero counts', () => {
    routerRenderer(
      <ConformaSummaryBar
        totalComponents={0}
        totalFailed={0}
        totalViolations={0}
        totalWarnings={0}
        totalSuccesses={0}
      />,
    );

    const strongElements = screen.getAllByRole('generic').filter((el) => el.tagName === 'STRONG');
    const counts = strongElements.map((el) => el.textContent);
    expect(counts.every((c) => c === '0')).toBe(true);
  });

  it('renders dividers between items', () => {
    const { container } = routerRenderer(<ConformaSummaryBar {...defaultProps} />);
    const dividers = container.querySelectorAll('[class*="divider"]');
    expect(dividers.length).toBe(4);
  });

  it('has the correct data-test attribute', () => {
    routerRenderer(<ConformaSummaryBar {...defaultProps} />);
    expect(screen.getByTestId('conforma-summary-bar')).toBeInTheDocument();
  });
});
