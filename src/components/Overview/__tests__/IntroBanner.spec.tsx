import { screen } from '@testing-library/react';
import { routerRenderer } from '../../../unit-test-utils/mock-react-router';
import IntroBanner from '../IntroBanner';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

describe('IntroBanner', () => {
  it('should render the intro banner with correct title and description', () => {
    routerRenderer(<IntroBanner />);

    expect(screen.getByText('Get started with Konflux')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Konflux makes it easy to securely build, test and release your software projects to a wide variety of targets.',
      ),
    ).toBeInTheDocument();
  });

  it('should render the View my namespaces button with correct attributes', () => {
    routerRenderer(<IntroBanner />);

    const viewNamespacesButton = screen.getByRole('link', { name: 'View my namespaces' });
    expect(viewNamespacesButton).toBeInTheDocument();
    expect(viewNamespacesButton).toHaveAttribute('data-test', 'view-my-applications');
    expect(viewNamespacesButton).toHaveAttribute('href', '/ns');
  });

  it('should render the Release Monitor Board button when release monitor feature is online official', () => {
    routerRenderer(<IntroBanner />);

    const releaseMonitorButton = screen.queryByRole('link', { name: 'Release Monitor Board' });
    expect(releaseMonitorButton).toBeInTheDocument();
  });

  it('should render the overview banner image', () => {
    routerRenderer(<IntroBanner />);

    expect(screen.getByTestId('intro-banner-image')).toBeInTheDocument();
  });

  it('should apply correct CSS classes', () => {
    routerRenderer(<IntroBanner />);

    expect(screen.getByTestId('intro-banner')).toBeInTheDocument();
    expect(screen.getByTestId('intro-banner-content')).toBeInTheDocument();
    expect(screen.getByTestId('intro-banner-image')).toBeInTheDocument();
  });
});
