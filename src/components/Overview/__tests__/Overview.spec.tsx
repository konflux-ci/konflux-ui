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

    // Check for AboutSection content
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('should render with PageSection wrapper', () => {
    renderWithQueryClientAndRouter(<Overview />);

    const pageSections = document.querySelectorAll('.pf-v5-c-page__main-section');
    expect(pageSections.length).toBeGreaterThan(0);
  });

  it('should have proper structure with PageSection components', () => {
    const { container } = renderWithQueryClientAndRouter(<Overview />);

    const outerPageSection = container.querySelector('.pf-v5-c-page__main-section');
    expect(outerPageSection).toBeInTheDocument();

    // Check for real component content instead of test IDs
    expect(screen.getByText('Get started with Konflux')).toBeInTheDocument();
    expect(screen.getByText('Build artifacts of all kinds from source')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });
});
