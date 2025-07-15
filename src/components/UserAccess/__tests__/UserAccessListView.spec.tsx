import { MemoryRouter } from 'react-router-dom';
import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { defaultKonfluxRoleMap } from '../../../__data__/role-data';
import { mockRoleBinding, mockRoleBindings } from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { useRoleBindings } from '../../../hooks/useRoleBindings';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { RBListRow } from '../RBListRow';
import { UserAccessListView } from '../UserAccessListView';

jest.useFakeTimers();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Link: (props) => <a href={props.to}>{props.children}</a>,
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

const UserAccessList = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['username']}>
      <UserAccessListView />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('UserAccessListView', () => {
  const mockNamespace = 'test-ns';
  const useNamespaceMock = mockUseNamespaceHook(mockNamespace);
  const useAccessReviewModalMock = useAccessReviewForModel as jest.Mock;
  const useRoleBindingsMock = useRoleBindings as jest.Mock;
  const useRoleMapMock = useRoleMap as jest.Mock;

  beforeEach(() => {
    useNamespaceMock.mockReturnValue(mockNamespace);
    useAccessReviewModalMock.mockReturnValue([true]);
    useRoleBindingsMock.mockReturnValue([mockRoleBindings, true]);
    useRoleMapMock.mockReturnValue([defaultKonfluxRoleMap, true]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should display loading state while fetching role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[], false]);
    render(UserAccessList);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display error state if role bindings fail to load', () => {
    useRoleBindingsMock.mockReturnValue([[], true, { code: 451 }]);
    render(UserAccessList);
    expect(screen.getByText('Unable to load role bindings')).toBeInTheDocument();
  });

  it('should display role bindings when loaded', () => {
    useRoleBindingsMock.mockReturnValue([[mockRoleBinding], true]);
    render(UserAccessList);
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('should display empty state if no role bindings match the filter', async () => {
    render(UserAccessList);
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'no-match' } });
      jest.advanceTimersByTime(700);
    });
    await waitFor(() => {
      expect(screen.getByText(/No results match this filter/)).toBeInTheDocument();
    });
  });

  it('should filter role bindings by username', () => {
    render(UserAccessList);
    const filter = screen.getByPlaceholderText<HTMLInputElement>('Filter by username...');
    act(() => {
      fireEvent.change(filter, { target: { value: 'user1' } });
      jest.advanceTimersByTime(700);
    });
    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.queryByText('user2')).not.toBeInTheDocument();
  });

  it('should show the empty state when there are no role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[], true]);
    render(UserAccessList);
    expect(screen.getByText('Grant access')).toBeInTheDocument();
  });

  it('should allow creating a role binding if the user has permission', () => {
    useAccessReviewModalMock.mockReturnValue([true]);
    render(UserAccessList);
    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton).toBeEnabled();
  });

  it('should not allow creating a role binding if the user does not have permission', () => {
    useAccessReviewModalMock.mockReturnValue([false]);
    render(UserAccessList);
    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton.getAttribute('aria-disabled')).toEqual('true');
  });

  it('should handle undefined subjects in role bindings', () => {
    useRoleBindingsMock.mockReturnValue([[{ ...mockRoleBinding, subjects: undefined }], true]);
    const r = render(UserAccessList);
    const rows = r.getAllByRole('row');
    expect(rows.length).toBe(2);
    expect(rows[1]).toHaveTextContent('-');
  });
});
