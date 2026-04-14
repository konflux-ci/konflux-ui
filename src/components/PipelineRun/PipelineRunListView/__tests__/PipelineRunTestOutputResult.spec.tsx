import { render, screen } from '@testing-library/react';
import { AggregatedTestResult } from '~/hooks/usePipelineRunTestOutputResult';
import { PipelineRunTestOutputResult } from '../PipelineRunTestOutputResult';

jest.mock('../PipelineRunTestOutputResult.scss', () => ({}));

describe('PipelineRunTestOutputResult', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "-" when aggregatedTestResult is null', () => {
    render(<PipelineRunTestOutputResult aggregatedTestResult={null} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('renders all three counters with correct counts', () => {
    const result: AggregatedTestResult = { successes: 5, failures: 2, warnings: 1 };
    render(<PipelineRunTestOutputResult aggregatedTestResult={result} />);

    expect(screen.getByLabelText('2 failures')).toBeInTheDocument();
    expect(screen.getByLabelText('1 warning')).toBeInTheDocument();
    expect(screen.getByLabelText('5 successes')).toBeInTheDocument();
  });

  it('uses singular labels when count is 1', () => {
    const result: AggregatedTestResult = { successes: 1, failures: 1, warnings: 1 };
    render(<PipelineRunTestOutputResult aggregatedTestResult={result} />);

    expect(screen.getByLabelText('1 failure')).toBeInTheDocument();
    expect(screen.getByLabelText('1 warning')).toBeInTheDocument();
    expect(screen.getByLabelText('1 success')).toBeInTheDocument();
  });

  it('renders zero counts correctly', () => {
    const result: AggregatedTestResult = { successes: 0, failures: 0, warnings: 0 };
    render(<PipelineRunTestOutputResult aggregatedTestResult={result} />);

    expect(screen.getByLabelText('0 failures')).toBeInTheDocument();
    expect(screen.getByLabelText('0 warnings')).toBeInTheDocument();
    expect(screen.getByLabelText('0 successes')).toBeInTheDocument();
  });

  it('renders failures first, then warnings, then successes', () => {
    const result: AggregatedTestResult = { successes: 3, failures: 2, warnings: 2 };
    const { container } = render(<PipelineRunTestOutputResult aggregatedTestResult={result} />);

    const resultDivs = container.querySelectorAll('.test-result-cell__result');
    expect(resultDivs).toHaveLength(3);
    expect(resultDivs[0]).toHaveAttribute('aria-label', '2 failures');
    expect(resultDivs[1]).toHaveAttribute('aria-label', '2 warnings');
    expect(resultDivs[2]).toHaveAttribute('aria-label', '3 successes');
  });
});
