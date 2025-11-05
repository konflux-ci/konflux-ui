import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '../../../unit-test-utils/rendering-utils';
import ImportForm from '../ImportForm';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({ t: (x) => x })),
}));

// Helper to set URL search params
const mockURLSearchParams = (searchString: string) => {
  delete (window as { location?: { search: string } }).location;
  (window as { location: { search: string } }).location = {
    search: searchString,
  };
};

describe('ImportForm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('when creating a new application', () => {
    beforeEach(() => {
      mockURLSearchParams('');
    });

    it('should render correct title and description for new application', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      expect(screen.getByRole('heading', { name: 'Create an Application' })).toBeInTheDocument();

      expect(
        screen.getByText('An application is one or more components that run together.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
        'href',
        'https://konflux-ci.dev/docs/building/creating/',
      );
    });

    it('should set correct breadcrumbs for new application', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      // For new application, "Applications" is not a link, just text
      expect(screen.getByText('Applications')).toBeInTheDocument();
      // Check for heading specifically to avoid breadcrumb ambiguity
      expect(screen.getByRole('heading', { name: 'Create an Application' })).toBeInTheDocument();
    });

    it('should render GitImportForm component', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      // Check that the GitImportForm is rendered by looking for form elements
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('when creating a component for existing application', () => {
    beforeEach(() => {
      mockURLSearchParams('?application=my-app');
    });

    it('should render correct title and description for new component', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      expect(screen.getByRole('heading', { name: 'Create a Component' })).toBeInTheDocument();

      expect(
        screen.getByText('An application is one or more components that run together.'),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Learn more' })).toHaveAttribute(
        'href',
        'https://konflux-ci.dev/docs/building/creating/',
      );
    });

    it('should set correct breadcrumbs for new component', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      // Check for breadcrumb links (real breadcrumbs include namespace context)
      expect(screen.getByRole('link', { name: 'Applications' })).toHaveAttribute(
        'href',
        '/ns//applications',
      );
      // Check for heading instead of breadcrumb text to avoid ambiguity
      expect(screen.getByRole('heading', { name: 'Create a Component' })).toBeInTheDocument();
    });

    it('should render GitImportForm component with application context', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      // Check that the GitImportForm is rendered by looking for form elements
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('URL parameter parsing edge cases', () => {
    it('should handle empty application parameter', () => {
      mockURLSearchParams('?application=');
      renderWithQueryClientAndRouter(<ImportForm />);

      expect(screen.getByRole('heading', { name: 'Create an Application' })).toBeInTheDocument();
      // Check that the form is rendered
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should handle application parameter with spaces', () => {
      mockURLSearchParams('?application=my%20app%20name');
      renderWithQueryClientAndRouter(<ImportForm />);

      expect(screen.getByRole('heading', { name: 'Create a Component' })).toBeInTheDocument();
      // Check that the form is rendered with application context
      expect(document.querySelector('form')).toBeInTheDocument();
    });

    it('should handle multiple query parameters', () => {
      mockURLSearchParams('?foo=bar&application=test-app&baz=qux');
      renderWithQueryClientAndRouter(<ImportForm />);

      expect(screen.getByRole('heading', { name: 'Create a Component' })).toBeInTheDocument();
      // Check that the form is rendered with application context
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('PageSection structure', () => {
    beforeEach(() => {
      mockURLSearchParams('');
    });

    it('should render GitImportForm within PageSection', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      // Check for real page structure instead of data-test attributes
      expect(document.querySelector('.pf-v5-c-page__main-group')).toBeInTheDocument();
      expect(document.querySelector('.pf-v5-c-page__main-section')).toBeInTheDocument();
      expect(document.querySelector('form')).toBeInTheDocument();
    });
  });

  describe('External link attributes', () => {
    beforeEach(() => {
      mockURLSearchParams('');
    });

    it('should render external link with correct security attributes', () => {
      renderWithQueryClientAndRouter(<ImportForm />);

      // Find the "Learn more" link directly
      const externalLink = screen.getByRole('link', { name: 'Learn more' });
      expect(externalLink).toHaveAttribute('target', '_blank');
      expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
      expect(externalLink).toHaveAttribute(
        'href',
        'https://konflux-ci.dev/docs/building/creating/',
      );
    });
  });
});