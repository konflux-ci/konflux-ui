import { fireEvent, screen } from '@testing-library/react';
import type { ConformaResultRow } from '~/types/conforma';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import { ConformaEarlyWarning } from '../ConformaEarlyWarning';
import '@testing-library/jest-dom';

const createWarning = (overrides: Partial<ConformaResultRow> = {}): ConformaResultRow => ({
  title: 'Deprecated base image',
  description: 'Base image will be disallowed',
  status: CONFORMA_RESULT_STATUS.warnings,
  component: 'api-gateway',
  msg: 'Image no longer supported',
  images: [],
  ...overrides,
});

describe('ConformaEarlyWarning', () => {
  it('renders nothing when warningCount is 0', () => {
    const { container } = routerRenderer(
      <ConformaEarlyWarning warningCount={0} warnings={[]} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders the warning alert with data-test attribute', () => {
    routerRenderer(
      <ConformaEarlyWarning warningCount={1} warnings={[createWarning()]} />,
    );
    expect(screen.getByTestId('conforma-early-warning')).toBeInTheDocument();
  });

  it('displays singular title for 1 warning', () => {
    routerRenderer(
      <ConformaEarlyWarning warningCount={1} warnings={[createWarning()]} />,
    );
    expect(
      screen.getByText('1 upcoming policy change requires attention'),
    ).toBeInTheDocument();
  });

  it('displays plural title for multiple warnings', () => {
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={3}
        warnings={[createWarning(), createWarning(), createWarning()]}
      />,
    );
    expect(
      screen.getByText('3 upcoming policy changes require attention'),
    ).toBeInTheDocument();
  });

  it('shows expandable details section with data-test attribute', () => {
    routerRenderer(
      <ConformaEarlyWarning warningCount={1} warnings={[createWarning()]} />,
    );
    expect(screen.getByTestId('conforma-early-warning-details')).toBeInTheDocument();
    expect(screen.getByText('Show details')).toBeInTheDocument();
  });

  it('expands to show warning details on toggle', () => {
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={1}
        warnings={[createWarning({ title: 'CVE policy', component: 'auth-service' })]}
      />,
    );

    fireEvent.click(screen.getByText('Show details'));

    expect(screen.getByText('CVE policy')).toBeInTheDocument();
    expect(screen.getByText(/auth-service/)).toBeInTheDocument();
    expect(screen.getByText('Hide details')).toBeInTheDocument();
  });

  it('collapses details on second toggle', () => {
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={1}
        warnings={[createWarning({ title: 'CVE policy' })]}
      />,
    );

    fireEvent.click(screen.getByText('Show details'));
    expect(screen.getByText('CVE policy')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Hide details'));
    expect(screen.getByText('Show details')).toBeInTheDocument();
  });

  it('shows "Policy is now active" label when timestamp is in the past', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={1}
        warnings={[createWarning({ timestamp: pastDate })]}
      />,
    );

    fireEvent.click(screen.getByText('Show details'));

    expect(screen.getByText('Policy is now active')).toBeInTheDocument();
    expect(screen.getByText('Active now')).toBeInTheDocument();
  });

  it('shows days-until label when timestamp is in the future', () => {
    const futureDate = new Date(Date.now() + 5 * 86400000).toISOString();
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={1}
        warnings={[createWarning({ timestamp: futureDate })]}
      />,
    );

    fireEvent.click(screen.getByText('Show details'));

    expect(screen.getByText(/Policy activates in \d+ days?/)).toBeInTheDocument();
    expect(screen.getByText(/Activates in \d+d/)).toBeInTheDocument();
  });

  it('shows remediation text when solution is provided', () => {
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={1}
        warnings={[createWarning({ solution: 'Upgrade to ubi9-minimal' })]}
      />,
    );

    fireEvent.click(screen.getByText('Show details'));

    expect(screen.getByText(/Remediation: Upgrade to ubi9-minimal/)).toBeInTheDocument();
  });

  it('does not show remediation when solution is absent', () => {
    routerRenderer(
      <ConformaEarlyWarning
        warningCount={1}
        warnings={[createWarning({ solution: undefined })]}
      />,
    );

    fireEvent.click(screen.getByText('Show details'));

    expect(screen.queryByText(/Remediation:/)).not.toBeInTheDocument();
  });

  it('renders all warning items when expanded', () => {
    const warnings = [
      createWarning({ title: 'Rule A', component: 'comp-1' }),
      createWarning({ title: 'Rule B', component: 'comp-2' }),
      createWarning({ title: 'Rule C', component: 'comp-3' }),
    ];
    routerRenderer(
      <ConformaEarlyWarning warningCount={3} warnings={warnings} />,
    );

    fireEvent.click(screen.getByText('Show details'));

    expect(screen.getByText('Rule A')).toBeInTheDocument();
    expect(screen.getByText('Rule B')).toBeInTheDocument();
    expect(screen.getByText('Rule C')).toBeInTheDocument();
    expect(screen.getByText(/comp-1/)).toBeInTheDocument();
    expect(screen.getByText(/comp-2/)).toBeInTheDocument();
    expect(screen.getByText(/comp-3/)).toBeInTheDocument();
  });
});
