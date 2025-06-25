import { MemoryRouter } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { FormikProps } from 'formik';
import { useReleasePlans } from '../../../../../hooks/useReleasePlans';
import { useSnapshotsForApplication } from '../../../../../hooks/useSnapshots';
import { formikRenderer } from '../../../../../utils/test-utils';
import { TriggerReleaseFormValues } from '../form-utils';
import { TriggerReleaseForm, getApplicationNameForReleasePlan } from '../TriggerReleaseForm';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useLocation: () => jest.fn(),
  };
});

jest.mock('../AddIssueSection/AddIssueSection', () => ({
  AddIssueSection: (props) => <span>{props.name}</span>,
}));

jest.mock('../../../../../hooks/useSnapshots', () => ({
  useSnapshotsForApplication: jest.fn(),
}));

jest.mock('../../../../../hooks/useReleasePlans', () => ({
  useReleasePlans: jest.fn(),
}));

jest.mock('../../../../../shared/hooks/useScrollShadows', () => ({
  useScrollShadows: jest.fn().mockReturnValue('none'),
}));

const useSnapshotsMock = useSnapshotsForApplication as jest.Mock;
const useReleasePlansMock = useReleasePlans as jest.Mock;

const TriggerRelease = (props) => (
  <MemoryRouter>
    <TriggerReleaseForm {...props} />
  </MemoryRouter>
);

describe('TriggerReleaseForm', () => {
  beforeEach(() => {
    useReleasePlansMock.mockReturnValue([[], false]);
    useSnapshotsMock.mockReturnValue({ data: [], isLoading: true });
  });
  it('should show trigger release button and heading', () => {
    const values = {};
    const props = { values } as FormikProps<TriggerReleaseFormValues>;
    const result = formikRenderer(TriggerRelease(props), values);
    expect(result.getByRole('heading', { name: 'Trigger release plan' })).toBeVisible();
    expect(result.getByRole('button', { name: 'Trigger' })).toBeVisible();
  });

  it('should show trigger release input fields', () => {
    const values = {};
    const props = { values } as FormikProps<TriggerReleaseFormValues>;
    const result = formikRenderer(TriggerRelease(props), values);
    expect(result.getByRole('textbox', { name: 'Synopsis' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Description' })).toBeVisible();
    expect(result.getByRole('textbox', { name: 'Topic' })).toBeVisible();

    screen.getByText('References');
    screen.getByTestId('add-reference-button');
  });

  it('should show release & snapshot dropdown in loading state', () => {
    const values = {};
    const props = { values } as FormikProps<TriggerReleaseFormValues>;
    formikRenderer(TriggerRelease(props), values);
    expect(screen.getByText('Loading release plans...')).toBeVisible();
    expect(screen.getByText('Loading snapshots...')).toBeVisible();
  });
});

describe('getApplicationNameForReleasePlan', () => {
  it('should return the application name if the release plan is found', () => {
    const releasePlans = [{ metadata: { name: 'plan1' }, spec: { application: 'app1' } }];
    const selectedReleasePlan = 'plan1';
    expect(getApplicationNameForReleasePlan(releasePlans, selectedReleasePlan, true)).toBe('app1');
  });

  it('should return an empty string if no matching release plan is found', () => {
    const releasePlans = [{ metadata: { name: 'plan1' }, spec: { application: 'app1' } }];
    const selectedReleasePlan = 'plan2';
    expect(getApplicationNameForReleasePlan(releasePlans, selectedReleasePlan, true)).toBe('');
  });

  it('should return an empty string if loaded is false', () => {
    const releasePlans = [{ metadata: { name: 'plan1' }, spec: { application: 'app1' } }];
    const selectedReleasePlan = 'plan2';
    expect(getApplicationNameForReleasePlan(releasePlans, selectedReleasePlan, false)).toBe('');
  });

  it('should return an empty string if release plan list is empty', () => {
    const releasePlans = [];
    const selectedReleasePlan = 'plan2';
    expect(getApplicationNameForReleasePlan(releasePlans, selectedReleasePlan, true)).toBe('');
  });

  it('should return an empty string if release plan has no application', () => {
    const releasePlans = [{ metadata: { name: 'plan1' }, spec: {} }];
    const selectedReleasePlan = 'plan1';
    expect(getApplicationNameForReleasePlan(releasePlans, selectedReleasePlan, true)).toBe('');
  });
});
