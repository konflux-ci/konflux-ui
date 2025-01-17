import { Table as PfTable, TableHeader } from '@patternfly/react-table/deprecated';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../../__data__/role-data';
import { mockRoleBinding, mockRoleBindings } from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { useRoleBindings } from '../../../hooks/useRoleBindings';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { useWorkspaceInfo } from '../../Workspace/useWorkspaceInfo';
import { RBListRow } from '../RBListRow';
import { UserAccessListView } from '../UserAccessListView';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useParams: jest.fn(),
  useNavigate: jest.fn().mockReturnValue(jest.fn()),
}));

jest.mock('../../Workspace/useWorkspaceInfo', () => ({
  useWorkspaceInfo: jest.fn(),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

jest.mock('../../../utils/rbac');
jest.mock('../../../hooks/useRoleBindings');
jest.mock('../../../hooks/useRole');
jest.mock('../../../hooks/useSearchParam');
jest.mock('../../../hooks/useSearchParam', () => ({
  useSearchParam: jest.fn(),
}));
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

jest.mock('@patternfly/react-core', () => {
  const originalModule = jest.requireActual('@patternfly/react-core');
  return {
    ...originalModule,
    Toolbar: ({ children }) => <div>{children}</div>,
  };
});

describe('UserAccessListView', () => {
  let setUsernameFilterMock: jest.Mock;

  const mockWorkspaceInfo = {
    workspace: 'test-ws',
    namespace: 'test-ns',
  };

  beforeEach(() => {
    setUsernameFilterMock = jest.fn();
    (useSearchParam as jest.Mock).mockReturnValue(['', setUsernameFilterMock, jest.fn()]);
    (useWorkspaceInfo as jest.Mock).mockReturnValue(mockWorkspaceInfo);
    (useAccessReviewForModel as jest.Mock).mockReturnValue([true]);
    (useRoleBindings as jest.Mock).mockReturnValue([mockRoleBindings, false]);
    (useRoleMap as jest.Mock).mockReturnValue([defaultKonfluxRoleMap, false]);
    (useSearchParam as jest.Mock).mockReturnValue(['', jest.fn(), jest.fn()]);
  });

  it('should display loading state while fetching role bindings', () => {
    (useRoleBindings as jest.Mock).mockReturnValue([[], true]);

    render(<UserAccessListView />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should display role bindings when loaded', () => {
    (useRoleBindings as jest.Mock).mockReturnValue([[mockRoleBinding], false]);
    render(<UserAccessListView />);
    expect(screen.getByText('user1')).toBeInTheDocument();
  });

  it('should display empty state if no role bindings match the filter', async () => {
    (useSearchParam as jest.Mock).mockReturnValue(['user111', jest.fn(), jest.fn()]);
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
    (useRoleBindings as jest.Mock).mockReturnValue([[], false]);

    render(<UserAccessListView />);

    expect(screen.getByText('Grant access')).toBeInTheDocument();
  });

  it('should allow creating a role binding if the user has permission', () => {
    (useAccessReviewForModel as jest.Mock).mockReturnValue([true]);

    render(<UserAccessListView />);

    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton).toBeEnabled();
  });

  it('should not allow creating a role binding if the user does not have permission', () => {
    (useAccessReviewForModel as jest.Mock).mockReturnValue([false]);

    render(<UserAccessListView />);

    const grantAccessButton = screen.getByText('Grant access');
    expect(grantAccessButton.getAttribute('aria-disabled')).toEqual('true');
  });
});
