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
    totalPolicyChanges: 2,
  };

  it('renders three summary sections', () => {
    routerRenderer(<ConformaSummaryBar {...defaultProps} />);

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Upcoming changes')).toBeInTheDocument();
    expect(screen.getByText('Results summary')).toBeInTheDocument();
  });

  it('renders component counts with separators in the Components section', () => {
    const { container } = routerRenderer(<ConformaSummaryBar {...defaultProps} />);

    const section = container.querySelector('[data-test="conforma-summary-components"]');
    expect(section).toHaveTextContent('10');
    expect(section).toHaveTextContent('total');
    expect(section).toHaveTextContent('3');
    expect(section).toHaveTextContent('failed');
  });

  it('counts only policy changes in the Upcoming changes section, not every warning', () => {
    const { container } = routerRenderer(<ConformaSummaryBar {...defaultProps} />);

    const section = container.querySelector('[data-test="conforma-summary-upcoming-changes"]');
    expect(section).toHaveTextContent('2 policy changes');
    expect(section).not.toHaveTextContent('4');
  });

  it('shows the uncollapsed policy change count alongside the display count', () => {
    const { container } = routerRenderer(
      <ConformaSummaryBar {...defaultProps} totalPolicyChangesRaw={5} />,
    );

    const section = container.querySelector('[data-test="conforma-summary-upcoming-changes"]');
    expect(section).toHaveTextContent('2 policy changes');
    expect(section).toHaveTextContent('(5 incl. multi-arch)');
  });

  it('renders violations, warnings, and success with separators in the Results summary section', () => {
    const { container } = routerRenderer(<ConformaSummaryBar {...defaultProps} />);

    const section = container.querySelector('[data-test="conforma-summary-results"]');
    expect(section).toHaveTextContent('7');
    expect(section).toHaveTextContent('violations');
    expect(section).toHaveTextContent('4');
    expect(section).toHaveTextContent('warnings');
    expect(section).toHaveTextContent('20');
    expect(section).toHaveTextContent('success');
  });

  it('renders with zero counts', () => {
    routerRenderer(
      <ConformaSummaryBar
        totalComponents={0}
        totalFailed={0}
        totalViolations={0}
        totalWarnings={0}
        totalSuccesses={0}
        totalPolicyChanges={0}
      />,
    );

    expect(screen.getByText('Components')).toBeInTheDocument();
    expect(screen.getByText('Upcoming changes')).toBeInTheDocument();
    expect(screen.getByText('Results summary')).toBeInTheDocument();
  });
});
