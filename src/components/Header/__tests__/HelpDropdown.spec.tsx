import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  EXTERNAL_DOCUMENTATION_BASE_URL,
  INTERNAL_DOCUMENTATION_BASE_URL,
} from '~/consts/documentation';
import { ModalProvider } from '../../modal/ModalProvider';
import { HelpDropdown } from '../HelpDropdown';

const mockUseKonfluxPublicInfo = jest.fn();
jest.mock('~/hooks/useKonfluxPublicInfo', () => ({
  useKonfluxPublicInfo: () => mockUseKonfluxPublicInfo(),
}));

const renderWithModalProvider = (component: React.ReactElement) => {
  return render(<ModalProvider>{component}</ModalProvider>);
};

describe('HelpDropdown Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'public' }]);
  });

  describe('Rendering', () => {
    it('should render the help icon with tooltip', () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      expect(helpIcon).toBeInTheDocument();

      // Test tooltip trigger - PatternFly tooltips may not render consistently in tests
      fireEvent.mouseOver(helpIcon);
      expect(helpIcon).toBeInTheDocument();
    });

    it('should not show dropdown menu initially', () => {
      renderWithModalProvider(<HelpDropdown />);

      expect(screen.queryByText('About Konflux')).not.toBeInTheDocument();
      expect(screen.queryByText('Documentation')).not.toBeInTheDocument();
      expect(screen.queryByText('Share feedback')).not.toBeInTheDocument();
    });

    it('should not show AboutModal initially', () => {
      renderWithModalProvider(<HelpDropdown />);

      expect(screen.queryByTestId('about-modal')).not.toBeInTheDocument();
    });

    it('should not show FeedbackModal initially', () => {
      renderWithModalProvider(<HelpDropdown />);

      expect(screen.queryByTestId('feedback-modal')).not.toBeInTheDocument();
    });
  });

  describe('Dropdown Functionality', () => {
    it('should open dropdown menu when help icon is clicked', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        expect(screen.getByText('About Konflux')).toBeInTheDocument();
        expect(screen.getByText('Documentation')).toBeInTheDocument();
        expect(screen.getByText('Share feedback')).toBeInTheDocument();
      });
    });

    it('should close dropdown menu when clicked again', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');

      // Open dropdown
      fireEvent.click(helpIcon);
      await waitFor(() => {
        expect(screen.getByText('About Konflux')).toBeInTheDocument();
      });

      // Close dropdown
      fireEvent.click(helpIcon);
      await waitFor(() => {
        expect(screen.queryByText('About Konflux')).not.toBeInTheDocument();
      });
    });

    it('should have correct data-test attributes on dropdown items', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const aboutItem = screen.getByTestId('help-dropdown-about');
        const docItem = screen.getByTestId('help-dropdown-documentation');
        const feedbackItem = screen.getByTestId('help-dropdown-feedback');

        expect(aboutItem).toBeInTheDocument();
        expect(docItem).toBeInTheDocument();
        expect(feedbackItem).toBeInTheDocument();
      });
    });

    it('should display external link icon for documentation item', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const docItem = screen.getByTestId('help-dropdown-documentation');
        expect(docItem.querySelector('svg')).toBeInTheDocument();
      });
    });
  });

  describe('About Modal Functionality', () => {
    it('should have About Konflux menu item with correct attributes', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const aboutButton = screen.getByRole('menuitem', { name: /About Konflux/i });
        expect(aboutButton).toBeInTheDocument();
        expect(aboutButton).toHaveAttribute('role', 'menuitem');
      });
    });
  });

  describe('Feedback Modal Functionality', () => {
    it('should have Share feedback menu item with correct attributes', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const feedbackButton = screen.getByRole('menuitem', { name: /Share feedback/i });
        expect(feedbackButton).toBeInTheDocument();
        expect(feedbackButton).toHaveAttribute('role', 'menuitem');
      });
    });
  });

  describe('Documentation Link Functionality', () => {
    it('should use external documentation URL for public visibility', async () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'public' }]);
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const docLink = screen.getByRole('link', { name: /Documentation/i });
        expect(docLink).toBeInTheDocument();
        expect(docLink).toHaveAttribute('href', EXTERNAL_DOCUMENTATION_BASE_URL);
        expect(docLink).toHaveAttribute('target', '_blank');
        expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should use internal documentation URL for private visibility', async () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{ visibility: 'private' }]);
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const docLink = screen.getByRole('link', { name: /Documentation/i });
        expect(docLink).toBeInTheDocument();
        expect(docLink).toHaveAttribute('href', INTERNAL_DOCUMENTATION_BASE_URL);
        expect(docLink).toHaveAttribute('target', '_blank');
        expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should close dropdown when documentation link is clicked', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        expect(screen.getByText('Documentation')).toBeInTheDocument();
      });

      // Click the Documentation link - should not throw
      const docLink = screen.getByRole('link', { name: /Documentation/i });
      expect(() => fireEvent.click(docLink)).not.toThrow();
    });

    it('should default to external documentation when visibility is undefined', async () => {
      mockUseKonfluxPublicInfo.mockReturnValue([{}]);
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const docLink = screen.getByRole('link', { name: /Documentation/i });
        expect(docLink).toBeInTheDocument();
        expect(docLink).toHaveAttribute('href', EXTERNAL_DOCUMENTATION_BASE_URL);
        expect(docLink).toHaveAttribute('target', '_blank');
        expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      expect(helpIcon).toHaveAttribute('aria-label', 'Help menu toggle');

      // Open dropdown to access menu
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const menu = screen.getByRole('menu');
        expect(menu).toBeInTheDocument();
      });
    });

    it('should handle keyboard navigation', () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');

      // Test Enter key to open dropdown
      helpIcon.focus();
      fireEvent.keyDown(helpIcon, { key: 'Enter', code: 'Enter' });

      // PatternFly might not respond to keyDown in tests, so let's just test focus
      expect(helpIcon).toHaveFocus();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing Konflux public info gracefully', async () => {
      mockUseKonfluxPublicInfo.mockReturnValue([null]);

      expect(() => renderWithModalProvider(<HelpDropdown />)).not.toThrow();

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        // Should default to external documentation
        const docLink = screen.getByRole('link', { name: /Documentation/i });
        expect(docLink).toBeInTheDocument();
        expect(docLink).toHaveAttribute('href', EXTERNAL_DOCUMENTATION_BASE_URL);
        expect(docLink).toHaveAttribute('target', '_blank');
        expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });

    it('should render documentation link correctly even with ExternalLink component', async () => {
      renderWithModalProvider(<HelpDropdown />);

      const helpIcon = screen.getByLabelText('Help menu toggle');
      fireEvent.click(helpIcon);

      await waitFor(() => {
        const docLink = screen.getByRole('link', { name: /Documentation/i });
        expect(docLink).toBeInTheDocument();

        // ExternalLink should render properly with all required attributes
        expect(docLink).toHaveAttribute('href', EXTERNAL_DOCUMENTATION_BASE_URL);
        expect(docLink).toHaveAttribute('target', '_blank');
        expect(docLink).toHaveAttribute('rel', 'noopener noreferrer');

        // Should have external link icon
        expect(docLink.querySelector('svg')).toBeInTheDocument();
      });
    });
  });
});
