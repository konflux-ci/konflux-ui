import { screen, fireEvent, act, render } from '@testing-library/react';
import { createK8sWatchResourceMock } from '../../../../../../utils/test-utils';
import { AddIssueModal, IssueType } from '../AddIssueModal';

const watchMockResource = createK8sWatchResourceMock();

describe('AddIssueModal', () => {
  beforeEach(() => {
    watchMockResource.mockReturnValue([
      [{ metadata: { name: 'component-1' } }, { metadata: { name: 'component-2' } }],
      true,
    ]);
  });

  it('should not show modal till Modal launcher button is clicked', () => {
    render(<AddIssueModal issueType={IssueType.BUG} bugArrayHelper={null} />);
    expect(screen.queryByTestId('add-issue-modal')).not.toBeInTheDocument();
  });

  it('should show modal when Modal launcher button is clicked', () => {
    render(<AddIssueModal issueType={IssueType.BUG} bugArrayHelper={null} />);
    const launchModalBtn = screen.getByTestId('modal-launch-btn');
    act(() => {
      fireEvent.click(launchModalBtn);
    });
    expect(screen.queryByTestId('add-issue-modal')).toBeInTheDocument();
  });

  it('should show Bug fields for Bug IssueType', () => {
    render(<AddIssueModal issueType={IssueType.BUG} bugArrayHelper={null} />);
    const launchModalBtn = screen.getByTestId('modal-launch-btn');
    act(() => {
      fireEvent.click(launchModalBtn);
    });
    screen.getByText('Add a bug fix');
    screen.getByText('Provide information about a Bug that has already been resolved.');
  });

  it('should show CVE fields for CVE IssueType', () => {
    render(<AddIssueModal issueType={IssueType.CVE} bugArrayHelper={null} />);
    const launchModalBtn = screen.getByTestId('modal-launch-btn');
    act(() => {
      fireEvent.click(launchModalBtn);
    });
    screen.getByText('Add CVE');
    screen.getByText('Provide information about a CVE that has already been resolved.');
  });
});
