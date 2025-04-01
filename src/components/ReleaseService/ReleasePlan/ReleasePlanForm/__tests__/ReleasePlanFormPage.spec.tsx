import { act, fireEvent, screen } from '@testing-library/react';
import * as yup from 'yup';
import { ReleasePlanKind } from '../../../../../types/coreBuildService';
import { namespaceRenderer } from '../../../../../utils/test-utils';
import { createReleasePlan, editReleasePlan } from '../form-utils';
import { ReleasePlanFormPage } from '../ReleasePlanFormPage';

jest.mock('../../../../../utils/analytics', () => ({
  ...jest.requireActual('../../../../../utils/analytics'),
  useTrackEvent: () => jest.fn,
}));

const navigateMock = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: jest.fn(() => ({})),
  Link: (props) => <a href={props.to}>{props.children}</a>,
  useNavigate: jest.fn(() => navigateMock),
}));

jest.mock('../form-utils', () => ({
  ...jest.requireActual('../form-utils'),
  createReleasePlan: jest.fn(),
  editReleasePlan: jest.fn(),
  releasePlanFormSchema: yup.object(),
}));

jest.mock('../ReleasePlanForm', () => ({
  ReleasePlanForm: ({ handleSubmit, handleReset }) => (
    <>
      <button onClick={handleSubmit}>Submit</button>
      <button onClick={handleReset}>Reset</button>
    </>
  ),
}));

const createReleasePlanMock = createReleasePlan as jest.Mock;
const editReleasePlanMock = editReleasePlan as jest.Mock;

describe('ReleasePlanFormPage', () => {
  it('should navigate on successful creation', async () => {
    createReleasePlanMock.mockResolvedValue({ metadata: {}, spec: {} });
    namespaceRenderer(<ReleasePlanFormPage />, 'test-ns');

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Submit' })));

    expect(createReleasePlanMock).toHaveBeenCalled();
    expect(createReleasePlanMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: '',
        application: '',
        autoRelease: false,
        standingAttribution: false,
        data: '',
        params: [],
        serviceAccount: '',
        target: '',
        git: {
          url: '',
          revision: '',
          path: '',
        },
      }),
      'test-ns',
    );
    expect(createReleasePlanMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).toHaveBeenCalledWith(`/ns/test-ns/release`);
  });

  it('should navigate on successful edit', async () => {
    editReleasePlanMock.mockResolvedValue({ metadata: {}, spec: {} });
    namespaceRenderer(
      <ReleasePlanFormPage releasePlan={{ metadata: {}, spec: {} } as ReleasePlanKind} />,
      'test-ns',
    );

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Submit' })));

    expect(editReleasePlanMock).toHaveBeenCalled();
    expect(editReleasePlanMock).toHaveBeenCalledTimes(2);
    expect(navigateMock).toHaveBeenCalledWith(`/ns/test-ns/release`);
  });

  it('should navigate to release list on reset', async () => {
    namespaceRenderer(
      <ReleasePlanFormPage releasePlan={{ metadata: {}, spec: {} } as ReleasePlanKind} />,
      'test-ns',
    );

    await act(() => fireEvent.click(screen.getByRole('button', { name: 'Reset' })));

    expect(navigateMock).toHaveBeenCalledWith(`/ns/test-ns/release`);
  });
});
