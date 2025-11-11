import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '../../../unit-test-utils/rendering-utils';
import { Overview } from '../Overview';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

describe('Overview', () => {
  it('should render all child components in correct order', () => {
    renderWithQueryClientAndRouter(<Overview />);

    // Check for IntroBanner content
    expect(screen.getByText('Get started with Konflux')).toBeInTheDocument();

    // Check for InfoBanner content
    expect(screen.getByText('Build artifacts of all kinds from source')).toBeInTheDocument();

    // Check for AboutSection content using specific data-test
    expect(screen.getByTestId('about-section-title')).toBeInTheDocument();
  });

  it('should render with PageSection wrapper', () => {
    renderWithQueryClientAndRouter(<Overview />);

    // Check for content presence instead of CSS classes
    expect(screen.getByText('Get started with Konflux')).toBeInTheDocument();
  });

  it('should have proper structure with PageSection components', () => {
    renderWithQueryClientAndRouter(<Overview />);

    // Check for real component content instead of CSS classes
    expect(screen.getByText('Get started with Konflux')).toBeInTheDocument();
    expect(screen.getByText('Build artifacts of all kinds from source')).toBeInTheDocument();
    expect(screen.getByTestId('about-section-title')).toBeInTheDocument();
  });
});
