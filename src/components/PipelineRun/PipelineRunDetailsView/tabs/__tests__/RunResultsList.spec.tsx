import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { TektonResultsRun } from '~/types';
import RunResultsList from '../RunResultsList';

describe('RunResultsList', () => {
  const renderComponent = (
    props: {
      results?: TektonResultsRun[];
      status?: string;
      compressed?: boolean;
    } = {},
  ) => {
    const { results = [], status = 'Succeeded', compressed } = props;
    return render(<RunResultsList results={results} status={status} compressed={compressed} />);
  };

  it('should render Results title and table when results are empty', () => {
    renderComponent({ results: [] });

    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByRole('grid', { name: 'results' })).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
  });

  it('should render result names and string values in the table', () => {
    const results: TektonResultsRun[] = [
      { name: 'IMAGE_URL', value: 'quay.io/org/image:tag' },
      { name: 'SCAN_RESULT', value: 'passed' },
    ];
    renderComponent({ results });

    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('IMAGE_URL')).toBeInTheDocument();
    expect(screen.getByText('quay.io/org/image:tag')).toBeInTheDocument();
    expect(screen.getByText('SCAN_RESULT')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
  });

  it('should normalize non-string result values', () => {
    const results = [
      { name: 'OUTPUT', value: { key: 'value', count: 1 } },
      { name: 'LIST', value: ['a', 'b'] },
    ] as unknown as TektonResultsRun[];
    renderComponent({ results });

    expect(screen.getByText('OUTPUT')).toBeInTheDocument();
    expect(screen.getByText('{"key":"value","count":1}')).toBeInTheDocument();
    expect(screen.getByText('LIST')).toBeInTheDocument();
    expect(screen.getByText('a, b')).toBeInTheDocument();
  });

  it('should render empty string for null or undefined result values', () => {
    const results = [
      { name: 'NULL_VAL', value: null },
      { name: 'UNDEF_VAL', value: undefined },
    ] as unknown as TektonResultsRun[];
    renderComponent({ results });

    expect(screen.getByText('NULL_VAL')).toBeInTheDocument();
    expect(screen.getByText('UNDEF_VAL')).toBeInTheDocument();
    const valueCells = screen.getAllByRole('cell', { name: '' });
    expect(valueCells).toHaveLength(2);
    expect(valueCells.every((el) => el.textContent === '')).toBe(true);
  });

  it('should render string values as-is without stringifying', () => {
    const results: TektonResultsRun[] = [{ name: 'TEXT', value: 'plain-text' }];
    renderComponent({ results });

    expect(screen.getByText('TEXT')).toBeInTheDocument();
    expect(screen.getByText('plain-text')).toBeInTheDocument();
  });

  it('should show empty state when status is Failed', () => {
    renderComponent({ results: [], status: 'Failed' });

    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: 'results' })).not.toBeInTheDocument();
    expect(screen.getByText('No results available due to failure')).toBeInTheDocument();
  });

  it('should not show table when status is Failed even with results', () => {
    const results: TektonResultsRun[] = [{ name: 'X', value: 'y' }];
    renderComponent({ results, status: 'Failed' });

    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.queryByRole('grid', { name: 'results' })).not.toBeInTheDocument();
    expect(screen.getByText('No results available due to failure')).toBeInTheDocument();
  });

  it('should render with compressed prop without crashing', () => {
    const results: TektonResultsRun[] = [{ name: 'A', value: 'B' }];
    expect(() => renderComponent({ results, compressed: true })).not.toThrow();
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
  });

  it('should pass pipeline-run-details test id to the description list', () => {
    renderComponent({ results: [] });
    expect(screen.getByTestId('pipeline-run-details')).toBeInTheDocument();
  });
});
