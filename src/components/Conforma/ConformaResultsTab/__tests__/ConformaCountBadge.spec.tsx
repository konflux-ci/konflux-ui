import { screen } from '@testing-library/react';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import { ConformaCountBadge } from '../ConformaCountBadge';
import '@testing-library/jest-dom';

describe('ConformaCountBadge', () => {
  it('renders 0 as plain text without a Label', () => {
    routerRenderer(<ConformaCountBadge count={0} type={CONFORMA_RESULT_STATUS.violations} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(
      screen.queryByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.violations}`),
    ).not.toBeInTheDocument();
  });

  it('renders non-zero violation count as a red Label', () => {
    routerRenderer(<ConformaCountBadge count={5} type={CONFORMA_RESULT_STATUS.violations} />);

    const badge = screen.getByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.violations}`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('5');
  });

  it('renders non-zero warning count as a gold Label', () => {
    routerRenderer(<ConformaCountBadge count={3} type={CONFORMA_RESULT_STATUS.warnings} />);

    const badge = screen.getByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.warnings}`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('renders non-zero success count as a green Label', () => {
    routerRenderer(<ConformaCountBadge count={12} type={CONFORMA_RESULT_STATUS.successes} />);

    const badge = screen.getByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.successes}`);
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('12');
  });

  it('renders 0 warnings as plain text', () => {
    routerRenderer(<ConformaCountBadge count={0} type={CONFORMA_RESULT_STATUS.warnings} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(
      screen.queryByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.warnings}`),
    ).not.toBeInTheDocument();
  });

  it('renders 0 successes as plain text', () => {
    routerRenderer(<ConformaCountBadge count={0} type={CONFORMA_RESULT_STATUS.successes} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(
      screen.queryByTestId(`conforma-count-badge-${CONFORMA_RESULT_STATUS.successes}`),
    ).not.toBeInTheDocument();
  });
});
