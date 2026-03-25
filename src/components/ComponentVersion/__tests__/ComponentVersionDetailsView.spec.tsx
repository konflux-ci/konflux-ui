import * as React from 'react';
import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { FLAGS } from '~/feature-flags/flags';
import { useIsOnFeatureFlag, useFeatureFlags } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import { ComponentKind, ComponentSpecs } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils/rendering-utils';
import ComponentVersionDetailsView from '../ComponentVersionDetailsView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
  Outlet: () => <div data-test="outlet" />,
}));

jest.mock('~/hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => {
  const useIsOnFeatureFlagMock = jest.fn();
  const useFeatureFlagsMock = jest.fn();
  return {
    useIsOnFeatureFlag: useIsOnFeatureFlagMock,
    useFeatureFlags: useFeatureFlagsMock,
    IfFeature: ({
      flag,
      children,
      fallback,
    }: {
      flag: string;
      children: React.ReactNode;
      fallback?: React.ReactNode;
    }) => {
      const isEnabled = useIsOnFeatureFlagMock(flag);
      return isEnabled ? children : fallback ?? null;
    },
  };
});

jest.mock('~/hooks/useDocumentTitle', () => ({
  useDocumentTitle: jest.fn(),
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseFeatureFlags = useFeatureFlags as jest.Mock;

const mockComponent: Partial<ComponentKind> = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
    uid: 'uid-1',
    creationTimestamp: '2024-01-01T00:00:00Z',
  },
  spec: {
    componentName: 'my-component',
    source: {
      url: 'https://github.com/org/repo',
      versions: [
        { name: 'Version 1.0', revision: 'ver-1.0', context: './frontend' },
        { name: 'Main', revision: 'main' },
      ],
    },
    containerImage: 'quay.io/org/repo',
  } as ComponentSpecs,
};

describe('ComponentVersionDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: 'ver-1.0',
    });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseFeatureFlags.mockReturnValue([{ 'components-page': true }, jest.fn()]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Unable to load Component version')).toBeInTheDocument();
  });

  it('should render 404 when version is not found', () => {
    useParamsMock.mockReturnValue({
      componentName: 'my-component',
      versionRevision: 'nonexistent',
    });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeInTheDocument();
  });

  it('should render the version details page with tabs', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('should render breadcrumbs including component and version names', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Components')).toBeInTheDocument();
    // "my-component" appears in both breadcrumbs and heading
    expect(screen.getAllByText('my-component').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(screen.getByText('Version 1.0')).toBeInTheDocument();
  });

  it('should render the component name as the heading', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByRole('heading', { name: /my-component/ })).toBeInTheDocument();
  });

  it('should show fallback when feature flag is disabled', () => {
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Feature flag disabled')).toBeInTheDocument();
    expect(
      screen.getByText(
        `To view this page, enable the "${FLAGS['components-page'].description}" feature flag.`,
      ),
    ).toBeInTheDocument();
  });
});
