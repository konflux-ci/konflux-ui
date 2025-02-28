import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../../__data__/role-data';
import { mockRoleBinding, mockRoleBindings } from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { useRoleBindings } from '../../../hooks/useRoleBindings';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { RBListRow } from '../RBListRow';
import { UserAccessListView } from '../UserAccessListView';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../hooks/useSearchParam', () => ({
  useSearchParam: jest.fn(),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));
jest.mock('../../../hooks/useRoleBindings');
jest.mock('../../../hooks/useRole');
jest.mock('../../../shared/components/table', () => {
  const actual = jest.requireActual('../../../shared/components/table');
  return {
    ...actual,
    Table: (props) => {
      const { data, filters, selected, match, kindObj } = props;
      const cProps = { data, filters, selected, match, kindObj };
      const columns = props.Header(cProps);
      return (
        <PfTable role="table" aria-label="table" cells={columns} variant="compact" borders={false}>
          <TableHeader role="rowgroup" />
          <tbody>
            {props.data.map((d, i) => (
              <tr key={i}>
                <RBListRow columns={null} obj={d} />
              </tr>
            ))}
          </tbody>
        </PfTable>
      );
    },
  };
});

describe('UserAccessListView', () => {
  const mockNamespace = 'test-ns';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useSearchParamMock = useSearchParam as jest.Mock;
  const useAccessReviewModalMock = useAccessReviewForModel as jest.Mock;
  const useRoleBindingsMock = useRoleBindings as jest.Mock;
  const useRoleMapMock = useRoleMap as jest.Mock;

  beforeEach(() => {
    useNamespaceMock.mockReturnValue(mockNamespace);
    useAccessReviewModalMock.mockReturnValue([true]);
    useRoleBindingsMock.mockReturnValue([mockRoleBindings, true]);
    useRoleMapMock.mockReturnValue([defaultKonfluxRoleMap, true]);
    useSearchParamMock.mockReturnValue(['', jest.fn(), jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while fetching role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[], false]);
    render(<UserAccessListView />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display role bindings when loaded', () => {
    useRoleBindingsMock.mockReturnValue([[mockRoleBinding], true]);
    render(<UserAccessListView />);
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('should display empty state if no role bindings match the filter', async () => {
    useSearchParamMock.mockReturnValue(['user111', jest.fn(), jest.fn()]);
    render(<UserAccessListView />);
    await waitFor(() => {
      expect(screen.getByText(/No results match this filter/)).toBeInTheDocument();
    });
  });

  it('should filter role bindings by username', () => {
    render(<UserAccessListView />);
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Search by username...');
    fireEvent.input(filter, { target: { value: 'user1' } });
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('should show the empty state when there are no role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[], true]);
    render(<UserAccessListView />);
    expect(screen.getByText('Grant access')).toBeInTheDocument();
  });

  it('should allow creating a role binding if the user has permission', () => {
    useAccessReviewModalMock.mockReturnValue([true]);
    render(<UserAccessListView />);
    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton).toBeEnabled();
  });

  it('should not allow creating a role binding if the user does not have permission', () => {
    useAccessReviewModalMock.mockReturnValue([false]);
    render(<UserAccessListView />);
    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton.getAttribute('aria-disabled')).toEqual('true');
  });
});
