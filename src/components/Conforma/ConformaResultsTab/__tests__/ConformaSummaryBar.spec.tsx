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

    const zeroElements = screen.getAllByText('0');
    expect(zeroElements).toHaveLength(5);
  });

  it('renders dividers between items', () => {
    const { container } = routerRenderer(<ConformaSummaryBar {...defaultProps} />);
    const dividers = container.querySelectorAll('[data-test="conforma-summary-divider"]');
    expect(dividers.length).toBe(4);
  });

  it('renders metrics with icons and correct labels', () => {
    routerRenderer(<ConformaSummaryBar {...defaultProps} />);
    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Failed Components')).toBeInTheDocument();
    expect(screen.getByText('Violations')).toBeInTheDocument();
    expect(screen.getByText('Warnings')).toBeInTheDocument();
    expect(screen.getByText('Successes')).toBeInTheDocument();

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('20')).toBeInTheDocument();
  });
});
