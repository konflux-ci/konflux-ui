import { render } from '@testing-library/react';
import { SpaceBindingRequest } from '../../../types';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import { SBRListRow } from '../SBRListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

const watchMock = createK8sWatchResourceMock();

const mockSBR: SpaceBindingRequest = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'SpaceBindingRequest',
  metadata: {
    name: 'test-sbr',
  },
  spec: {
    masterUserRecord: 'user',
    spaceRole: 'contributor',
  },
  status: {
    conditions: [
      {
        reason: 'Provisioned',
        status: 'True',
      },
    ],
  },
};

describe('SBRListRow', () => {
  it('should render correct user info', () => {
    watchMock.mockReturnValueOnce([mockSBR, true]);
    const wrapper = render(
      <SBRListRow
        obj={{
          masterUserRecord: 'user',
          role: 'contributor',
          bindingRequest: { name: 'test-sbr', namespace: 'test-ns' },
        }}
        columns={[]}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');
    wrapper.debug();

    expect(cells[0]).toHaveTextContent('user');
    expect(cells[1]).toHaveTextContent('contributor');
    expect(cells[2]).toHaveTextContent('Provisioned');
  });
});
