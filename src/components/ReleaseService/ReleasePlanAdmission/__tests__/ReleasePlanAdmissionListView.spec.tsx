import { render, waitFor } from '@testing-library/react';
import { useReleasePlanAdmissions } from '../../../../hooks/useReleasePlanAdmissions';
import { mockAccessReviewUtil } from '../../../../unit-test-utils/mock-access-review';
import { createUseWorkspaceInfoMock } from '../../../../utils/test-utils';
import { mockReleasePlanAdmission } from '../__data__/release-plan-admission.mock';
import ReleasePlanAdmissionListView from '../ReleasePlanAdmissionListView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('../../../../hooks/useSearchParam', () => ({
  useSearchParam: jest.fn(() => ['']),
}));

jest.mock('../../../../hooks/useReleasePlanAdmissions', () => ({
  useReleasePlanAdmissions: jest.fn(),
}));

const mockReleasePlanHook = useReleasePlanAdmissions as jest.Mock;

describe('ReleasePlanAdmissionListView', () => {
  createUseWorkspaceInfoMock({ namespace: 'abcd', workpsace: 'test-ws' });
  mockAccessReviewUtil('useAccessReviewForModels', [true, true]);

  it('should render progress bar while loading', async () => {
    mockReleasePlanHook.mockReturnValue([[], false]);
    const wrapper = render(<ReleasePlanAdmissionListView />);
    expect(await wrapper.findByRole('progressbar')).toBeTruthy();
  });

  it('should render empty state when no release Plans present', () => {
    mockReleasePlanHook.mockReturnValue([[], true]);
    const wrapper = render(<ReleasePlanAdmissionListView />);
    expect(wrapper.findByText('No Release Plan Admission found')).toBeTruthy();
  });

  it('should render table view for release plans', async () => {
    mockReleasePlanHook.mockReturnValue([[mockReleasePlanAdmission], true]);
    const wrapper = render(<ReleasePlanAdmissionListView />);
    await waitFor(() => expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1));
  });

  it('should render filter toolbar', async () => {
    mockReleasePlanHook.mockReturnValue([[mockReleasePlanAdmission], true]);
    const wrapper = render(<ReleasePlanAdmissionListView />);
    await waitFor(() => wrapper.getByTestId('release-plan-admission-list-toolbar'));
    expect(wrapper.container.getElementsByTagName('table')).toHaveLength(1);
    expect(wrapper.container.getElementsByTagName('tr')).toHaveLength(1);
  });
});
