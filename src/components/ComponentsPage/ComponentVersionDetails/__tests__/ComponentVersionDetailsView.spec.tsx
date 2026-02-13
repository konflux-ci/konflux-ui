import type { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { FLAGS } from '../../../../feature-flags/flags';
import { useIsOnFeatureFlag } from '../../../../feature-flags/hooks';
import { useComponent } from '../../../../hooks/useComponents';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import ComponentVersionDetailsView from '../ComponentVersionDetailsView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('../../../../feature-flags/hooks', () => ({
  ...jest.requireActual('../../../../feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(),
  IfFeature: ({
    flag,
    children,
    fallback,
  }: {
    flag: string;
    children: ReactNode;
    fallback?: ReactNode;
  }) => {
    const isEnabled = (useIsOnFeatureFlag as jest.Mock)(flag);
    return isEnabled ? children : fallback ?? null;
  },
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;

const mockComponent = {
  metadata: { name: 'my-component', namespace: 'test-ns' },
  spec: { componentName: 'my-component', source: { url: 'https://example.com/repo' } },
};

describe('ComponentVersionDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component', verName: 'main' });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    mockUseIsOnFeatureFlag.mockReturnValue(true);
  });

  it('should not render details page when componentName is missing', () => {
    useParamsMock.mockReturnValue({ verName: 'main' });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('should not render details page when verName is missing', () => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.queryByText('Overview')).not.toBeInTheDocument();
  });

  it('should show spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('Failed')]);
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should render details page when component is loaded and feature flag is on', () => {
    renderWithQueryClientAndRouter(<ComponentVersionDetailsView />);
    expect(screen.getByTestId('details')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('should render feature flag fallback when flag is disabled', () => {
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
