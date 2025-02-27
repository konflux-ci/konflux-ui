import * as React from 'react';
import { screen } from '@testing-library/react';
import {
  createK8sWatchResourceMock,
  createUseParamsMock,
  renderWithQueryClientAndRouter,
} from '../../../utils/test-utils';
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

const watchResourceMock = createK8sWatchResourceMock();

describe('ReleaseDetailsView', () => {
  createUseParamsMock({ applicationName: 'my-app', releaseName: 'test-release' });
  it('should render spinner if release data is not loaded', () => {
    watchResourceMock.mockReturnValue([[], false]);
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getByRole('progressbar')).toBeVisible();
  });

  it('should render the error state if the release is not found', () => {
    watchResourceMock.mockReturnValue([[], false, { code: 404 }]);
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getByText('404: Page not found')).toBeVisible();
    expect(screen.getByText('Go to applications list')).toBeVisible();
  });

  it('should render release name if release data is loaded', () => {
    const mockRelease = {
      metadata: {
        name: 'test-release',
      },
      spec: {
        releasePlan: 'test-releaseplan',
        snapshot: 'test-snapshot',
      },
    };
    watchResourceMock.mockReturnValue([mockRelease, true]);
    renderWithQueryClientAndRouter(<ReleaseDetailsView />);
    expect(screen.getAllByRole('heading')[0]).toHaveTextContent('test-release');
  });
});
