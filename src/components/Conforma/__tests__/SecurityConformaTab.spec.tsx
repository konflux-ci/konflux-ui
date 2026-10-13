import { Table, Thead, Tr, Th, Tbody } from '@patternfly/react-table';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import {
  mockUseSearchParamBatch,
  resetMockSearchParams,
} from '~/unit-test-utils/mock-useSearchParam';
import { routerRenderer } from '../../../utils/test-utils';
import { mockConformaUIData } from '../__data__/mockConformaLogsJson';
import { WrappedConformaRow } from '../ConformaTable/ConformaRow';
import { POLICY_EXCEPTION_RULE_CODES } from '../policy-exception-utils';
import { SecurityConformaTab } from '../SecurityConformaTab';
import { useConformaResult } from '../useConformaResult';
import { POLICY_EXCEPTION_FILTER_KEY } from '../usePolicyExceptionFilter';
import '@testing-library/jest-dom';

jest.useFakeTimers();

// Mock the custom hook
jest.mock('../useConformaResult', () => ({
  useConformaResult: jest.fn(),
}));

jest.mock('~/hooks/useSearchParam', () => ({
  useSearchParamBatch: () => mockUseSearchParamBatch(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({
    namespace: 'my-ns',
    applicationName: 'my-app',
    pipelineRunName: 'dummy-1',
  }),
}));

jest.mock('../../../shared/components/table/TableComponent', () => {
  return (props) => {
    const { data, filters, selected, match, kindObj } = props;
    const cProps = { data, filters, selected, match, kindObj };
    const columns = props.Header(cProps);

    return (
      <Table role="table" aria-label="table" variant="compact" borders={true}>
        <Thead>
          <Tr>
            {columns.map((col, idx) => (
              <Th key={idx} {...(col.props ?? {})}>
                {col.title}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {props.data.map((d, i) => (
            <Tr key={i}>
              <WrappedConformaRow
                obj={d}
                customData={{
                  sortedConformaResult: data,
                }}
              />
            </Tr>
          ))}
        </Tbody>
      </Table>
    );
  };
});

const mockUseConformaResult = useConformaResult as jest.Mock;

const securityConforma = (pipelineRun: string) => (
  <FilterContextProvider
    filterParams={['rule', 'status', 'component', POLICY_EXCEPTION_FILTER_KEY]}
  >
    <SecurityConformaTab pipelineRunName={pipelineRun} />
  </FilterContextProvider>
);

describe('SecurityConformaTab', () => {
  beforeEach(() => {
    // Filter state lives in a module-level mock shared by every test in this
    // file; reset it so applied filters do not leak between tests.
    resetMockSearchParams();
    mockUseConformaResult.mockReturnValue([mockConformaUIData, true, undefined]);
  });

  it('should render empty state for security tab when pods are missing', () => {
    mockUseConformaResult.mockReturnValue([undefined, true, undefined]);

    routerRenderer(securityConforma('dummy'));
    screen.getByTestId('security-tab-empty-state');
  });

  it('should render component security tab', async () => {
    routerRenderer(securityConforma('dummy'));
    await screen.findByText('Missing CVE scan results');
  });

  it('should filter out results based on the name input field', () => {
    const view = routerRenderer(securityConforma('dummy'));
    screen.getByText('Missing CVE scan results');
    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), {
      target: { value: 'No tasks' },
    });

    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityConforma('dummy'));
    expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), { target: { value: '' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityConforma('dummy'));
    screen.getByText('Missing CVE scan results');
  });

  it('should filter out based on the status dropdown', async () => {
    const view = routerRenderer(securityConforma('dummy-1'));
    screen.getByText('Missing CVE scan results');
    fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));
    fireEvent.click(
      screen.getByLabelText(/success/i, {
        selector: 'input',
      }),
    );
    view.rerender(securityConforma('dummy-1'));
    await waitFor(() => {
      expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('Clear all filters')[0]);
    view.rerender(securityConforma('dummy-1'));
    screen.getByText('Missing CVE scan results');
  });

  it('should show empty state when no search result found', () => {
    const view = routerRenderer(securityConforma('dummy-1'));
    screen.getByText('Missing CVE scan results');
    fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));
    fireEvent.click(
      screen.getByLabelText(/failed/i, {
        selector: 'input',
      }),
    );
    view.rerender(securityConforma('dummy-1'));
    screen.getByText('Missing CVE scan results');
    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), {
      target: { value: 'No tasks' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityConforma('dummy-1'));
    expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    screen.getByText('No results found');
    fireEvent.click(screen.getAllByText('Clear all filters')[1]);
    view.rerender(securityConforma('dummy-1'));
    screen.getByText('Missing CVE scan results');
  });

  it('should sort by Status', () => {
    const view = routerRenderer(securityConforma('dummy-1'));
    const status = screen.getAllByTestId('rule-status');
    expect(status[0].textContent.trim()).toEqual('Failed');
    fireEvent.click(screen.getAllByText('Status')[1]);
    view.rerender(securityConforma('dummy-1'));
    const sortstatus = screen.getAllByTestId('rule-status');
    expect(sortstatus[1].textContent.trim()).toEqual('Success');
  });

  it('should render the summary bar with component and result totals', () => {
    routerRenderer(securityConforma('dummy-1'));

    const resultSummary = screen.getByTestId('result-summary');
    expect(resultSummary).toContainElement(screen.getByTestId('conforma-summary-bar'));

    const components = screen.getByTestId('conforma-summary-components');
    expect(components).toHaveTextContent('1 total');
    expect(components).toHaveTextContent('1 failed');

    const results = screen.getByTestId('conforma-summary-results');
    expect(results).toHaveTextContent('1 violations');
    expect(results).toHaveTextContent('0 warnings');
    expect(results).toHaveTextContent('1 success');
  });

  it('should summarise every result, not just the filtered rows', () => {
    const view = routerRenderer(securityConforma('dummy-1'));

    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), {
      target: { value: 'No tasks' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityConforma('dummy-1'));

    expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    expect(screen.getByTestId('conforma-summary-results')).toHaveTextContent('1 violations');
  });

  describe('Show policy exceptions toggle', () => {
    const exceptionRule = {
      title: 'CVE exception',
      description: 'Outstanding CVEs are waived by a policy exception.',
      status: CONFORMA_RESULT_STATUS.warnings,
      expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
      component: 'devfile-sample-python-basic-aw05',
      msg: 'CVEs are waived until the exception lapses',
      collection: ['minimal'],
      images: [],
      code: 'volatile_config.expiring_rule',
    };

    // A warning that is NOT a policy exception: right status, unlisted rule.
    const plainWarningRule = {
      ...exceptionRule,
      title: 'Attestation signature check',
      msg: 'Provenance attestation is not signed',
      code: 'slsa_provenance.attestation_signed',
      expiresAt: undefined,
    };

    it('should filter the table down to warnings from policy exception rules', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule, plainWarningRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      // Unfiltered: every rule is listed
      screen.getByText('Missing CVE scan results');
      screen.getByText('CVE exception');
      screen.getByText('Attestation signature check');

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      screen.getByText('CVE exception');
      // Violations and successes are gone...
      expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
      expect(screen.queryByText('No tasks run')).not.toBeInTheDocument();
      // ...and so is a warning that is not a policy exception rule
      expect(screen.queryByText('Attestation signature check')).not.toBeInTheDocument();
    });

    it('should restore every rule when the toggle is switched back off', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));
      expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));
      screen.getByText('Missing CVE scan results');
    });

    it('should show the filtered empty state when no rule has an upcoming change', () => {
      // mockConformaUIData has no warnings at all
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      screen.getByText('No results found');
      expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    });

    it('should reset the toggle when filters are cleared', () => {
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));
      screen.getByText('No results found');

      fireEvent.click(screen.getAllByText('Clear all filters')[0]);
      view.rerender(securityConforma('dummy-1'));

      screen.getByText('Missing CVE scan results');
      expect(screen.getByTestId('conforma-show-policy-exceptions')).not.toBeChecked();
    });

    it('should apply the Warning status label and a label per matched rule', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      // Status label, same chip the Status dropdown produces
      screen.getByRole('button', { name: `Close ${CONFORMA_RESULT_STATUS.warnings}` });
      // Rule label per matched code
      screen.getByRole('button', { name: `Close ${exceptionRule.code}` });
    });

    it('should restore the previous status selection when switched off', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      // Pre-select a different status before using the toggle
      fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));
      fireEvent.click(screen.getByLabelText(/failed/i, { selector: 'input' }));
      view.rerender(securityConforma('dummy-1'));
      screen.getByRole('button', { name: `Close ${CONFORMA_RESULT_STATUS.violations}` });

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));
      screen.getByRole('button', { name: `Close ${CONFORMA_RESULT_STATUS.warnings}` });

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));
      screen.getByRole('button', { name: `Close ${CONFORMA_RESULT_STATUS.violations}` });
    });

    it('should drop a rule from the table when its label is removed', () => {
      const secondRule = {
        ...exceptionRule,
        title: 'SBOM check',
        msg: 'No SBOM found for the image',
        code: 'volatile_config.pending_rule',
      };
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule, secondRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));
      screen.getByText('CVE exception');
      screen.getByText('SBOM check');

      fireEvent.click(screen.getByRole('button', { name: `Close ${exceptionRule.code}` }));
      view.rerender(securityConforma('dummy-1'));

      screen.getByText('SBOM check');
      expect(screen.queryByText('CVE exception')).not.toBeInTheDocument();
    });

    it('should turn on and label every rule even when no row matches', () => {
      // Only rules that are not policy exceptions.
      mockUseConformaResult.mockReturnValue([mockConformaUIData, true, undefined]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      expect(screen.getByTestId('conforma-show-policy-exceptions')).toBeChecked();
      POLICY_EXCEPTION_RULE_CODES.forEach((code) => {
        const more = screen.queryByRole('button', { name: /\d+ more/ });
        if (more) fireEvent.click(more);
        screen.getByRole('button', { name: `Close ${code}` });
      });
      expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    });

    it('should write every rule code and the Warning status to the URL', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      const [getValues] = mockUseSearchParamBatch() as [
        () => Record<string, string>,
        (values: Record<string, string>) => void,
        () => void,
      ];
      const params = getValues();
      expect(JSON.parse(params[POLICY_EXCEPTION_FILTER_KEY])).toEqual([
        ...POLICY_EXCEPTION_RULE_CODES,
      ]);
      expect(JSON.parse(params.status)).toEqual([CONFORMA_RESULT_STATUS.warnings]);
    });

    it('should switch the toggle off when the last rule label is removed', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      // Every policy exception rule is labelled, not just the ones present in
      // the table, so the toggle only clears once the last label has gone.
      POLICY_EXCEPTION_RULE_CODES.forEach((code) => {
        const more = screen.queryByRole('button', { name: /\d+ more/ });
        if (more) fireEvent.click(more);
        fireEvent.click(screen.getByRole('button', { name: `Close ${code}` }));
        view.rerender(securityConforma('dummy-1'));
      });

      expect(screen.getByTestId('conforma-show-policy-exceptions')).not.toBeChecked();
      screen.getByText('Missing CVE scan results');
    });

    it('should leave the summary bar untouched', () => {
      mockUseConformaResult.mockReturnValue([
        [...mockConformaUIData, exceptionRule],
        true,
        undefined,
      ]);
      const view = routerRenderer(securityConforma('dummy-1'));

      fireEvent.click(screen.getByTestId('conforma-show-policy-exceptions'));
      view.rerender(securityConforma('dummy-1'));

      const results = screen.getByTestId('conforma-summary-results');
      expect(results).toHaveTextContent('1 violations');
      expect(results).toHaveTextContent('1 warnings');
      expect(results).toHaveTextContent('1 success');
    });
  });

  it('should render links with correct appName and component Name', () => {
    routerRenderer(securityConforma('dummy-1'));

    const links = screen.getAllByRole('link');

    // Ensure there is at least one link rendered
    expect(links.length).toBeGreaterThan(0);

    // Check that all relevant hrefs include expected params
    // Only check the last two component links
    const lastTwoLinks = links.slice(-2);
    lastTwoLinks.forEach((link) => {
      const href = link.getAttribute('href');
      expect(href).toContain('my-app');
      // Get the related component name
      const expectedComponent = mockConformaUIData[lastTwoLinks.indexOf(link)].component;
      // Get the href component name
      const hrefParts = href?.split('/');
      const lastField = hrefParts?.[hrefParts.length - 1];
      expect(lastField).toBe(expectedComponent);
    });
  });
});
