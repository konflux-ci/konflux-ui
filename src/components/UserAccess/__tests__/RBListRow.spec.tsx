import { render, screen } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../../__data__/role-data';
import { mockRoleBinding } from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { mockUseNamespaceHook } from '../../../unit-test-utils/mock-namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { UserAccessTableBodyRow } from '../RBListRow';
import { UserAccessTableRow } from '../userAccessTableRows';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../hooks/useRole', () => ({
  useRoleMap: jest.fn(),
}));

jest.mock('../../../utils/rbac', () => ({
  useAccessReviewForModel: jest.fn(),
}));

jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: () => jest.fn(),
}));

const mockNamespace = 'test-ns';
const useNamespaceMock = mockUseNamespaceHook(mockNamespace);

const mockRow = (rb: typeof mockRoleBinding): UserAccessTableRow => ({
  roleBinding: rb,
  subject: rb.subjects?.[0] ?? null,
  rowKey: `${rb.metadata.name}__0__User__${rb.subjects?.[0]?.name ?? 'subject'}`,
});

function renderRow(row: UserAccessTableRow) {
  return render(
    <table>
      <tbody>
        <UserAccessTableBodyRow obj={row} rowIndex={0} isSelected={false} onSelectRow={jest.fn()} />
      </tbody>
    </table>,
  );
}

describe('UserAccessTableBodyRow', () => {
  const mockUseRoleMap = useRoleMap as jest.Mock;
  const mockUseAccessReview = useAccessReviewForModel as jest.Mock;

  beforeEach(() => {
    useNamespaceMock.mockReturnValue(mockNamespace);
    mockUseAccessReview.mockReturnValue([true]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render username, role, and role binding name', () => {
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, true]);

    renderRow(mockRow(mockRoleBinding));

    expect(screen.getByText('user1')).toBeInTheDocument();
    expect(screen.getByText('Contributor')).toBeInTheDocument();
    expect(screen.getByText('metadata-name')).toBeInTheDocument();
  });

  it('should render skeleton for role while the role map is loading', () => {
    mockUseRoleMap.mockReturnValue([defaultKonfluxRoleMap, false]);

    const { container } = renderRow(mockRow(mockRoleBinding));

    expect(container.querySelector('.pf-v5-c-skeleton')).toBeInTheDocument();
  });
});
