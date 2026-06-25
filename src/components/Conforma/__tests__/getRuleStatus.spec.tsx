import { render, screen } from '@testing-library/react';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { getRuleStatus } from '../utils';

describe('getRuleStatus', () => {
  it('renders "Failed" for violations', () => {
    render(<>{getRuleStatus(CONFORMA_RESULT_STATUS.violations)}</>);
    expect(screen.getByText(CONFORMA_RESULT_STATUS.violations)).toBeInTheDocument();
  });

  it('renders "Warning" for warnings', () => {
    render(<>{getRuleStatus(CONFORMA_RESULT_STATUS.warnings)}</>);
    expect(screen.getByText(CONFORMA_RESULT_STATUS.warnings)).toBeInTheDocument();
  });

  it('renders "Success" for successes', () => {
    render(<>{getRuleStatus(CONFORMA_RESULT_STATUS.successes)}</>);
    expect(screen.getByText(CONFORMA_RESULT_STATUS.successes)).toBeInTheDocument();
  });

  it('renders "Missing" fallback for null', () => {
    render(<>{getRuleStatus(null as unknown as CONFORMA_RESULT_STATUS)}</>);
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });

  it('renders "Missing" fallback for undefined', () => {
    render(<>{getRuleStatus(undefined as unknown as CONFORMA_RESULT_STATUS)}</>);
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });

  it('renders "Missing" fallback for an unknown value', () => {
    render(<>{getRuleStatus('unknown-status' as unknown as CONFORMA_RESULT_STATUS)}</>);
    expect(screen.getByText('Missing')).toBeInTheDocument();
  });
});
