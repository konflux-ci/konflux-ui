import * as React from 'react';
import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { FLAGS } from '../../../../feature-flags/flags';
import { useIsOnFeatureFlag, useFeatureFlags } from '../../../../feature-flags/hooks';
import { useComponent } from '../../../../hooks/useComponents';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import ComponentDetailsView from '../ComponentDetailsView';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('../../../../feature-flags/hooks', () => {
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

const useComponentMock = useComponent as jest.Mock;
const useParamsMock = useParams as jest.Mock;
const mockUseIsOnFeatureFlag = useIsOnFeatureFlag as jest.Mock;
const mockUseFeatureFlags = useFeatureFlags as jest.Mock;

const mockComponent = {
  metadata: {
    name: 'my-component',
    namespace: 'test-ns',
  },
  spec: {
    componentName: 'my-component',
    source: {
      url: 'https://example.com/repo',
    },
  },
};

describe('ComponentDetailsView', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
    mockUseIsOnFeatureFlag.mockReturnValue(true);
    mockUseFeatureFlags.mockReturnValue([{ 'components-page': true }, jest.fn()]);
  });

  it('should render spinner while loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should render error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, { code: 500 }]);
    renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should render details when component is loaded', () => {
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(screen.getByRole('heading', { name: /my-component/ })).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('should render nothing when feature flag is disabled', () => {
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    mockUseIsOnFeatureFlag.mockReturnValue(false);
    const { container } = renderWithQueryClientAndRouter(<ComponentDetailsView />);

    expect(container.firstChild).not.toBeNull();
    expect(screen.getByText('Feature flag disabled')).toBeInTheDocument();
    expect(
      screen.getByText(
        `To view this page, enable the "${FLAGS['components-page'].description}" feature flag.`,
      ),
    ).toBeInTheDocument();
  });
});
