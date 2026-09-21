import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import ComponentGroupDetailsView from '~/components/ComponentGroups/ComponentGroupsDetails/ComponentGroupDetailsView';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { ComponentGroupKind } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('~/hooks/useComponentGroups', () => ({
  useComponentGroup: jest.fn(),
}));

jest.mock('~/feature-flags/FeatureFlagIndicator', () => ({
  FeatureFlagIndicator: () => null,
}));

jest.mock('~/components/DetailsPage', () => ({
  DetailsPage: ({
    headTitle,
    baseURL,
    tabs,
  }: {
    headTitle: string;
    baseURL: string;
    tabs: { key: string; label: string; isFilled?: boolean }[];
  }) => (
    <div data-test="details-page">
      <span data-test="head-title">{headTitle}</span>
      <span data-test="base-url">{baseURL}</span>
      {tabs.map((tab) => (
        <span key={tab.key} data-test="details-tab">
          {tab.label}
        </span>
      ))}
    </div>
  ),
}));

const useParamsMock = useParams as jest.Mock;
const useComponentGroupMock = useComponentGroup as jest.Mock;

const mockGroup = {
  apiVersion: 'appstudio.redhat.com/v1beta2',
  kind: 'ComponentGroup',
  metadata: { name: 'frontend-stack', namespace: 'test-ns' },
  spec: { components: [] },
} as ComponentGroupKind;

describe('ComponentGroupDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ groupName: 'frontend-stack' });
    useComponentGroupMock.mockReturnValue([mockGroup, true, undefined]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should show a spinner while the component group is loading', () => {
    useComponentGroupMock.mockReturnValue([null, false, undefined]);

    renderWithQueryClientAndRouter(<ComponentGroupDetailsView />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show an error when the component group fails to load', () => {
    useComponentGroupMock.mockReturnValue([null, true, { code: 500, message: 'Server error' }]);

    renderWithQueryClientAndRouter(<ComponentGroupDetailsView />);

    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should render the Components tab for the loaded group', () => {
    renderWithQueryClientAndRouter(<ComponentGroupDetailsView />);

    expect(screen.getByTestId('head-title')).toHaveTextContent('frontend-stack');
    expect(screen.getByTestId('base-url')).toHaveTextContent('/ns/test-ns/groups/frontend-stack');
    expect(screen.getAllByTestId('details-tab')).toHaveLength(1);
    expect(screen.getByTestId('details-tab')).toHaveTextContent('Components');
  });
});
