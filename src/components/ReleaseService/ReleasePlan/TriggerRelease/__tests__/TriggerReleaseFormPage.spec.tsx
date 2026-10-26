import { act, fireEvent, screen } from '@testing-library/react';
import * as yup from 'yup';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import { createK8sWatchResourceMock } from '~/utils/test-utils';
import { createRelease } from '../form-utils';
import { TriggerReleaseFormPage } from '../TriggerReleaseFormPage';

jest.mock('../../../../../utils/analytics', () => ({
  ...jest.requireActual('../../../../../utils/analytics'),
  useTrackEvent: () => jest.fn,
}));

const navigateMock = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({})),
  useSearchParams: jest.fn(() => [
    new URLSearchParams({ releasePlan: 'rp1', application: 'app1' }),
    jest.fn(),
  ]),
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: jest.fn(() => navigateMock),
  useParams: jest.fn(() => ({})),
}));

jest.mock('../form-utils', () => ({
  ...jest.requireActual('../form-utils'),
  createRelease: jest.fn(),
  triggerReleaseFormSchema: yup.object(),
}));

jest.mock('../TriggerReleaseForm', () => ({
  TriggerReleaseForm: ({ handleSubmit, handleReset }) => (
    <>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleReset}>Reset</button>
    </>
  ),
}));

const triggerReleasePlanMock = createRelease as jest.Mock;
const watchResourceMock = createK8sWatchResourceMock();

describe('TriggerReleaseFormPage', () => {
  beforeEach(() => {
    mockUseNamespaceHook('test-ns');
    watchResourceMock.mockReturnValue([[], true]);
  });

  it('should navigate on successful trigger', async () => {
    watchResourceMock.mockReturnValue([
      [{ metadata: { name: 'rp1' }, spec: { application: 'app1' } }],
      true,
    ]);
    triggerReleasePlanMock.mockResolvedValue({ metadata: { name: 'newRelease' }, spec: {} });
    renderWithQueryClientAndRouter(<TriggerReleaseFormPage />);

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Submit' })));

    expect(triggerReleasePlanMock).toHaveBeenCalled();
    expect(triggerReleasePlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        description: '',
        labels: [{ key: '', value: '' }],
        references: [],
        releasePlan: 'rp1',
        snapshot: '',
        synopsis: '',
        topic: '',
      }),
      'test-ns',
    );
    expect(navigateMock).toHaveBeenCalledWith('/ns/test-ns/applications/app1/releases/newRelease');
  });

  it('should navigate to release list on reset', async () => {
    renderWithQueryClientAndRouter(<TriggerReleaseFormPage />);

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Reset' })));

    expect(navigateMock).toHaveBeenCalledWith('/ns/test-ns/release');
  });
});
