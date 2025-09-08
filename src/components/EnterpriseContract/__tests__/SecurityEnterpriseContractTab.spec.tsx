import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { mockUseSearchParamBatch } from '~/unit-test-utils/mock-useSearchParam';
import { routerRenderer } from '../../../utils/test-utils';
import { mockEnterpriseContractUIData } from '../__data__/mockEnterpriseContractLogsJson';
import { WrappedEnterpriseContractRow } from '../EnterpriseContractTable/EnterpriseContractRow';
import { SecurityEnterpriseContractTab } from '../SecurityEnterpriseContractTab';
import { useEnterpriseContractResults } from '../useEnterpriseContractResultFromLogs';
import '@testing-library/jest-dom';

jest.useFakeTimers();

// Mock the custom hook
jest.mock('../useEnterpriseContractResultFromLogs', () => ({
  useEnterpriseContractResults: jest.fn(),
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
      <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
        <TableHeader role="rowgroup" />
        <tbody>
          {props.data.map((d, i) => (
            <tr key={i}>
              <WrappedEnterpriseContractRow
                obj={d}
                customData={{
                  sortedECResult: data,
                }}
              />
            </tr>
          ))}
        </tbody>
      </PfTable>
    );
  };
});

const mockUseEnterpriseContractResults = useEnterpriseContractResults as jest.Mock;

const securityEnterpriseContracts = (pipelineRun: string) => (
  <FilterContextProvider filterParams={['rule', 'status', 'component']}>
    <SecurityEnterpriseContractTab pipelineRun={pipelineRun} />
  </FilterContextProvider>
);

describe('SecurityEnterpriseContractTab', () => {
  beforeEach(() => {
    mockUseEnterpriseContractResults.mockReturnValue([mockEnterpriseContractUIData, true]);
  });

  it('should render empty state for security tab when pods are missing', () => {
    mockUseEnterpriseContractResults.mockReturnValue([undefined, true]);

    routerRenderer(securityEnterpriseContracts('dummy'));
    screen.getByTestId('security-tab-empty-state');
  });

  it('should render component security tab', async () => {
    routerRenderer(securityEnterpriseContracts('dummy'));
    await screen.findByText('Missing CVE scan results');
  });

  it('should filter out results based on the name input field', () => {
    const view = routerRenderer(securityEnterpriseContracts('dummy'));
    screen.getByText('Missing CVE scan results');
    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), {
      target: { value: 'No tasks' },
    });

    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityEnterpriseContracts('dummy'));
    expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();

    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), { target: { value: '' } });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityEnterpriseContracts('dummy'));
    screen.getByText('Missing CVE scan results');
  });

  it('should filter out based on the status dropdown', async () => {
    const view = routerRenderer(securityEnterpriseContracts('dummy-1'));
    screen.getByText('Missing CVE scan results');
    fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));
    fireEvent.click(
      screen.getByLabelText(/success/i, {
        selector: 'input',
      }),
    );
    view.rerender(securityEnterpriseContracts('dummy-1'));
    await waitFor(() => {
      expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByText('Clear all filters')[0]);
    view.rerender(securityEnterpriseContracts('dummy-1'));
    screen.getByText('Missing CVE scan results');
  });

  it('should show empty state when no search result found', () => {
    const view = routerRenderer(securityEnterpriseContracts('dummy-1'));
    screen.getByText('Missing CVE scan results');
    fireEvent.click(screen.getByRole('button', { name: /status filter menu/i }));
    fireEvent.click(
      screen.getByLabelText(/failed/i, {
        selector: 'input',
      }),
    );
    view.rerender(securityEnterpriseContracts('dummy-1'));
    screen.getByText('Missing CVE scan results');
    fireEvent.input(screen.getByPlaceholderText('Filter by rule...'), {
      target: { value: 'No tasks' },
    });
    act(() => {
      jest.advanceTimersByTime(700);
    });
    view.rerender(securityEnterpriseContracts('dummy-1'));
    expect(screen.queryByText('Missing CVE scan results')).not.toBeInTheDocument();
    screen.getByText('No results found');
    fireEvent.click(screen.getAllByText('Clear all filters')[1]);
    view.rerender(securityEnterpriseContracts('dummy-1'));
    screen.getByText('Missing CVE scan results');
  });

  it('should sort by Status', () => {
    const view = routerRenderer(securityEnterpriseContracts('dummy-1'));
    const status = screen.getAllByTestId('rule-status');
    expect(status[0].textContent.trim()).toEqual('Failed');
    fireEvent.click(screen.getAllByText('Status')[1]);
    view.rerender(securityEnterpriseContracts('dummy-1'));
    const sortstatus = screen.getAllByTestId('rule-status');
    expect(sortstatus[1].textContent.trim()).toEqual('Success');
  });

  it('should render result summary', () => {
    routerRenderer(securityEnterpriseContracts('dummy-1'));
    const resultSummary = screen.getByTestId('result-summary');
    const status = resultSummary.getElementsByTagName('span');
    expect(status[0].textContent.trim()).toBe('Failed');
    expect(status[1].textContent.trim()).toBe('Warning');
    expect(status[2].textContent.trim()).toBe('Success');
    const value = resultSummary.getElementsByTagName('b');
    expect(value[0].textContent).toBe('1');
    expect(value[1].textContent).toBe('0');
    expect(value[2].textContent).toBe('1');
  });

  it('should render links with correct appName and component Name', () => {
    routerRenderer(securityEnterpriseContracts('dummy-1'));

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
      const expectedComponent = mockEnterpriseContractUIData[lastTwoLinks.indexOf(link)].component;
      // Get the href component name
      const hrefParts = href?.split('/');
      const lastField = hrefParts?.[hrefParts.length - 1];
      expect(lastField).toBe(expectedComponent);
    });
  });
});
