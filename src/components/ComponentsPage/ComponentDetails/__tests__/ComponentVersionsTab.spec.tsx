import React from 'react';
import { useParams } from 'react-router-dom';
import { screen } from '@testing-library/react';
import { useComponentBranches } from '../../../../hooks/useComponentBranches';
import { useComponent } from '../../../../hooks/useComponents';
import { renderWithQueryClientAndRouter } from '../../../../unit-test-utils';
import { mockUseNamespaceHook } from '../../../../unit-test-utils/mock-namespace';
import ComponentVersionsTab from '../tabs/ComponentVersionsTab';

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: jest.fn(),
}));

jest.mock('../../../../hooks/useComponents', () => ({
  useComponent: jest.fn(),
}));

jest.mock('../../../../hooks/useComponentBranches', () => ({
  useComponentBranches: jest.fn(),
}));

jest.mock('~/feature-flags/hooks', () => ({
  ...jest.requireActual('~/feature-flags/hooks'),
  useIsOnFeatureFlag: jest.fn(() => true),
  IfFeature: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const useParamsMock = useParams as jest.Mock;
const useComponentMock = useComponent as jest.Mock;
const useComponentBranchesMock = useComponentBranches as jest.Mock;

const mockComponent = {
  metadata: { name: 'my-component', namespace: 'test-ns' },
  spec: { componentName: 'my-component' },
};

describe('ComponentVersionsTab', () => {
  mockUseNamespaceHook('test-ns');

  beforeEach(() => {
    useParamsMock.mockReturnValue({ componentName: 'my-component' });
    useComponentMock.mockReturnValue([mockComponent, true, undefined]);
    useComponentBranchesMock.mockReturnValue([['main', 'develop'], true, undefined]);
  });

  it('should return null when componentName is missing', () => {
    useParamsMock.mockReturnValue({});
    const { container } = renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(container.firstChild).toBeNull();
  });

  it('should show spinner when component is loading', () => {
    useComponentMock.mockReturnValue([undefined, false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when component fails to load', () => {
    useComponentMock.mockReturnValue([undefined, true, new Error('Failed')]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Unable to load component')).toBeInTheDocument();
  });

  it('should show spinner when branches are loading', () => {
    useComponentBranchesMock.mockReturnValue([[], false, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('should show error state when branches fail to load', () => {
    useComponentBranchesMock.mockReturnValue([[], true, new Error('Failed')]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Unable to load branches')).toBeInTheDocument();
  });

  it('should display Versions section with empty message when no branches', () => {
    useComponentBranchesMock.mockReturnValue([[], true, undefined]);
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(
      screen.getByText('No branches with pipeline runs found for this component.'),
    ).toBeInTheDocument();
  });

  it('should display list of version links when branches exist', () => {
    renderWithQueryClientAndRouter(<ComponentVersionsTab />);
    expect(screen.getByText('Versions')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Branches that have pipeline runs for this component. Select a branch to view its overview and activity.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId('component-versions-list')).toBeInTheDocument();
    expect(screen.getByTestId('version-link-main')).toBeInTheDocument();
    expect(screen.getByTestId('version-link-develop')).toBeInTheDocument();
  });
});
