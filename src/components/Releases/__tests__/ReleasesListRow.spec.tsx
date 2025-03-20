import { render } from '@testing-library/react';
import { ReleaseCondition } from '../../../types';
import ReleasesListRow from '../ReleasesListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

const mockRelease = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'test-release',
    creationTimestamp: '2023-01-20T14:13:29Z',
  },
  spec: {
    releasePlan: 'test-plan',
    snapshot: 'test-snapshot',
  },
  status: {
    conditions: [
      {
        reason: 'Succeeded',
        status: 'True',
        type: ReleaseCondition.Released,
      },
    ],
    startTime: '2023-01-20T15:00:00Z',
    completionTime: '2023-01-20T16:30:00Z',
  },
};

const mockPendingRelease = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'test-pending-release',
    creationTimestamp: '2023-01-20T14:13:29Z',
  },
  spec: {
    releasePlan: 'test-plan',
    snapshot: 'test-snapshot',
  },
  status: {},
};

describe('ReleasesListRow', () => {
  it('should render release info', () => {
    const wrapper = render(
      <ReleasesListRow
        obj={mockRelease}
        columns={[]}
        customData={{ applicationName: 'test-app' }}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');
    const status = wrapper.getAllByTestId('release-status');

    expect(cells[0].children[0].innerHTML).toBe(mockRelease.metadata.name);
    expect(cells[3].innerHTML).toBe('test-plan');
    expect(cells[4].innerHTML).toBe(
      '<a href="/ns//applications/test-app/snapshots/test-snapshot">test-snapshot</a>',
    );
    expect(status[0].innerHTML).toBe('Succeeded');
  });

  it('should present pending releases appropriately', () => {
    const wrapper = render(
      <ReleasesListRow
        obj={mockPendingRelease}
        columns={[]}
        customData={{ applicationName: 'test-app' }}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].children[0].innerHTML).toBe(mockPendingRelease.metadata.name);
    // The release is pending, so there's no reasonable duration
    expect(cells[2].innerHTML).toBe('-');
  });
});
