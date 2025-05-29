import { render } from '@testing-library/react';
import { defaultKonfluxRoleMap } from '../../../__data__/role-data';
import { mockRoleBinding } from '../../../__data__/rolebinding-data';
import { useRoleMap } from '../../../hooks/useRole';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import { RBListRow } from '../RBListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

jest.mock('../../../hooks/useRole', () => ({
  useRoleMap: jest.fn(),
}));

const watchMock = createK8sWatchResourceMock();

describe('RBListRow', () => {
  it('should render correct user info', () => {
    const mockUseRoleMap = useRoleMap as jest.Mock;
    watchMock.mockReturnValueOnce([mockRoleBinding, false]);
    mockUseRoleMap.mockReturnValueOnce([defaultKonfluxRoleMap, true, null]);
    const wrapper = render(<RBListRow obj={mockRoleBinding} columns={[]} />, {
      container: document.createElement('tr'),
    });
    const cells = wrapper.container.getElementsByTagName('td');
    wrapper.debug();

    expect(cells[0]).toHaveTextContent('user1');
    expect(cells[1]).toHaveTextContent('Contributor');
    expect(cells[2]).toHaveTextContent('metadata-name');
  });

  it('should render spinner', () => {
    const mockUseRoleMap = useRoleMap as jest.Mock;
    watchMock.mockReturnValueOnce([mockRoleBinding, false]);
    mockUseRoleMap.mockReturnValueOnce([defaultKonfluxRoleMap, true, null]);
    const wrapper = render(<RBListRow obj={mockRoleBinding} columns={[]} />, {
      container: document.createElement('div'),
    });
    wrapper.container.getElementsByTagName('spinner');
  });
});
