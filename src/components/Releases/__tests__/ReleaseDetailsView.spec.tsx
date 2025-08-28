import * as React from 'react';
import { screen } from '@testing-library/react';
import { useK8sAndKarchResource } from '~/hooks/useK8sAndKarchResources';
import { createUseParamsMock, renderWithQueryClientAndRouter } from '../../../utils/test-utils';
import ReleaseDetailsView from '../ReleaseDetailsView';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useNavigate: jest.fn(),
    useSearchParams: () => React.useState(() => new URLSearchParams()),
  };
});

jest.mock('../../../hooks/useK8sAndKarchResources', () => ({
  useK8sAndKarchResource: jest.fn(),
}));

const useMockRelease = useK8sAndKarchResource as jest.Mock;

describe('ReleaseDetailsView', () => {
  createUseParamsMock({ applicationName: 'my-app', releaseName: 'test-release' });
  const mockRelease = {
    metadata: {
      name: 'test-release',
    },
    spec: {
      releasePlan: 'test-releaseplan',
      snapshot: 'test-snapshot',
    },
  };
  it('should render spinner if release data is not loaded', () => {
    useMockRelease.mockReturnValue({
      data: mockRelease,
      isLoading: true,
      fetchError: undefined,
      wsError: undefined,
      isError: false,
    });
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render the error state if the release is not found', () => {
    useMockRelease.mockReturnValue({
      data: {},
      isLoading: false,
      fetchError: { code: 404 },
      wsError: undefined,
      isError: true,
    });
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeVisible();
    expect(screen.getByText('Go to applications list')).toBeVisible();
  });

  it('should render release name if release data is loaded', () => {
    useMockRelease.mockReturnValue({ data: mockRelease, isLoading: false, error: false });
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('test-release');
  });
});
