import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { APPLICATION_DETAILS_PATH } from '../../../../routes/paths';
import { renderWithQueryClient } from '../../../../utils/test-utils';
import { mockReleasePlanAdmission } from '../__data__/release-plan-admission.mock';
import ReleasePlanAdmissionListRow from '../ReleasePlanAdmissionListRow';

jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

describe('ReleasePlanAdmissionListRow', () => {
  it('should render release plan admission data into table cells', () => {
    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={{ ...mockReleasePlanAdmission }}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].innerHTML).toBe(mockReleasePlanAdmission.metadata.name);
    expect(cells[2].innerHTML).toBe('sbudhwar-1-tenant');
    expect(cells[3].innerHTML).toBe('True');

    const appLink = screen.getByRole('link', { name: 'my-app-1' });
    expect(appLink).toHaveAttribute(
      'href',
      APPLICATION_DETAILS_PATH.createPath({
        workspaceName: 'test-namespace',
        applicationName: 'my-app-1',
      }),
    );
  });

  it('should display "-" when applications list is empty', () => {
    const mockRPAWithNoApplications = {
      ...mockReleasePlanAdmission,
      spec: {
        ...mockReleasePlanAdmission.spec,
        applications: [],
      },
    };
    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockRPAWithNoApplications}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].innerHTML).toBe(mockReleasePlanAdmission.metadata.name);
    expect(cells[2].innerHTML).toBe('sbudhwar-1-tenant');
    expect(cells[3].innerHTML).toBe('True');

    const applicationsListDiv = wrapper.container.querySelector('.truncated-link-list');
    expect(applicationsListDiv).toBeInTheDocument();
    expect(applicationsListDiv).toHaveTextContent('-');
  });

  it('should show "more" popover button when there are more than 3 applications', async () => {
    const user = userEvent.setup();

    const mockRPAWithManyApplications = {
      ...mockReleasePlanAdmission,
      spec: {
        ...mockReleasePlanAdmission.spec,
        applications: ['app-1', 'app-2', 'app-3', 'app-4', 'app-5'],
      },
    };

    renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockRPAWithManyApplications}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );

    expect(screen.getByRole('link', { name: 'app-1' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'app-2' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'app-3' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'app-4' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'app-5' })).not.toBeInTheDocument();

    const moreButton = screen.getByText('2 more');
    await user.click(moreButton);

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'app-4' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'app-5' })).toBeInTheDocument();
    });
  });

  it('should display "True" when block-releases label is set to true', () => {
    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockReleasePlanAdmission}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('True');
  });

  it('should display "False" when block-releases label is set to false', () => {
    const mockRPAWithBlockReleasesFalse = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: {
          'release.appstudio.openshift.io/block-releases': 'false',
        },
      },
    };

    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockRPAWithBlockReleasesFalse}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('False');
  });

  it('should display "-" when block-releases label is missing', () => {
    const mockRPAWithoutBlockReleasesLabel = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: {},
      },
    };

    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockRPAWithoutBlockReleasesLabel}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('-');
  });

  it('should display "-" when labels object is undefined', () => {
    const mockRPAWithoutLabels = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: undefined,
      },
    };

    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockRPAWithoutLabels}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('-');
  });

  it('should display "-" when labels exist but block-releases label is missing', () => {
    const mockRPAWithOtherLabels = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: {
          'some.other.label': 'value',
          'another.label': 'another-value',
        },
      },
    };

    const wrapper = renderWithQueryClient(
      <ReleasePlanAdmissionListRow
        obj={mockRPAWithOtherLabels}
        customData={{
          namespace: 'test-namespace',
        }}
      />,
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('-');
  });
});
