import { screen, fireEvent, cleanup } from '@testing-library/react';
import { UIEnterpriseContractData } from '~/types';
import { routerRenderer } from '~/utils/test-utils';
import { mockEnterpriseContractUIData } from '../__data__/mockEnterpriseContractLogsJson';
import { SecurityEnterpriseContractTab } from '../SecurityEnterpriseContractTab';
import { useEnterpriseContractResults } from '../useEnterpriseContractResultFromLogs';

// Mock the custom hook
jest.mock('../useEnterpriseContractResultFromLogs', () => ({
  useEnterpriseContractResults: jest.fn(),
}));

const mockUseEnterpriseContractResults = useEnterpriseContractResults as jest.Mock;

// Mock the EnterpriseContractTable component to ensure we just test the filter
// and summary work well.
jest.mock('../EnterpriseContractTable/EnterpriseContractTable', () => {
  const mockEnterpriseContractTable = jest.fn((props) => (
    <div data-test="mock-ec-table">{JSON.stringify(props)}</div>
  ));

  return {
    __esModule: true,
    EnterpriseContractTable: mockEnterpriseContractTable,
  };
});

function filterRule(rule: string) {
  const ruleInput = screen.getByPlaceholderText('Filter by rule...');
  fireEvent.change(ruleInput, { target: { value: rule } });
}

function filterComponentOrStatus(componentOrStatus: string, name: string) {
  const toggle = screen.getByRole('button', { name: `${componentOrStatus} filter menu` });
  fireEvent.click(toggle);
  const checkbox = document.querySelector(`input[id*=${name}`);
  fireEvent.click(checkbox);
}

function confirmResult(data: UIEnterpriseContractData) {
  const expectedResult = { ecResult: [data] };
  expect(JSON.parse(screen.getByTestId('mock-ec-table').textContent)).toEqual(expectedResult);
}

function clearAllFilters() {
  const clearAllButtons = screen.queryAllByText(/Clear all filters/i);
  // click the general clear
  if (clearAllButtons.length > 0) {
    const firstClearAllButton = clearAllButtons[0];
    fireEvent.click(firstClearAllButton);
  }
}

describe('SecurityEnterpriseContractTab', () => {
  beforeEach(() => {
    mockUseEnterpriseContractResults.mockReturnValue([mockEnterpriseContractUIData, true]);
    routerRenderer(<SecurityEnterpriseContractTab pipelineRun="dummy-pipeline" />);
    clearAllFilters();
  });
  afterEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  it('renders the loading state initially', () => {
    // Mock the hook to return loading state
    mockUseEnterpriseContractResults.mockReturnValue([[], false]);
    routerRenderer(<SecurityEnterpriseContractTab pipelineRun="dummy-pipeline" />);
    // Check if loading spinner is rendered
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders the empty state when no EC results are available', () => {
    // Mock the hook to return empty results and loaded state
    mockUseEnterpriseContractResults.mockReturnValue([[], true]);
    routerRenderer(<SecurityEnterpriseContractTab pipelineRun="dummy-pipeline" />);
    // Check if the empty state is rendered
    expect(screen.getByText(/No results found/i)).toBeInTheDocument();
  });

  it('renders the results summary when EC results are loaded', () => {
    expect(screen.getByTestId('mock-ec-table')).toBeInTheDocument();
    const summary = screen.getByTestId('result-summary');
    expect(summary).toHaveTextContent('Failed1 Warning0 Success1');
  });

  it('filters EC results by rule', () => {
    filterRule('no task');
    confirmResult(mockEnterpriseContractUIData[1]);
  });

  it('filters EC results by component', () => {
    filterComponentOrStatus('Component', mockEnterpriseContractUIData[1].component);
    confirmResult(mockEnterpriseContractUIData[1]);
  });

  it('filters EC results by status', () => {
    filterComponentOrStatus('Status', mockEnterpriseContractUIData[0].status);
    confirmResult(mockEnterpriseContractUIData[0]);
  });

  it('clears filters when clear all is clicked', () => {
    filterComponentOrStatus('Status', mockEnterpriseContractUIData[1].status);
    filterRule(mockEnterpriseContractUIData[0].title);
    expect(screen.getByText('No results found')).toBeInTheDocument();
    clearAllFilters();
    expect(screen.queryAllByText('No results found').length).toBe(0);
    expect(JSON.parse(screen.getByTestId('mock-ec-table').textContent).ecResult.length).toBe(2);
  });
});
