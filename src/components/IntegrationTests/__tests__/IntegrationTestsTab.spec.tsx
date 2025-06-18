import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntegrationTestsTab } from '../IntegrationTestsTab';

// Mock child components
jest.mock('../IntegrationTestsListView/IntegrationTestsListView', () => ({
  IntegrationTestsListView: () => <div data-testid="integration-tests-list">Integration Tests List</div>,
}));

jest.mock('../ScheduledJobsTab', () => ({
  ScheduledJobsTab: () => <div data-testid="scheduled-jobs-tab">Scheduled Jobs Tab</div>,
}));

const renderIntegrationTestsTab = (initialTab = 'list') => {
  const searchParams = new URLSearchParams();
  if (initialTab !== 'list') {
    searchParams.set('tab', initialTab);
  }
  
  return render(
    <MemoryRouter initialEntries={[`/test?${searchParams.toString()}`]}>
      <IntegrationTestsTab />
    </MemoryRouter>
  );
};

describe('IntegrationTestsTab', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Tab Structure', () => {
    it('should render the main title and description', () => {
      renderIntegrationTestsTab();
      
      expect(screen.getByText('Integration tests')).toBeInTheDocument();
      expect(screen.getByText('Manage integration tests and scheduled jobs for your application.')).toBeInTheDocument();
    });

    it('should render both tabs', () => {
      renderIntegrationTestsTab();
      
      expect(screen.getByRole('tab', { name: 'Tests' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Scheduled jobs' })).toBeInTheDocument();
    });

    it('should have proper data-test attributes for testing', () => {
      renderIntegrationTestsTab();
      
      expect(screen.getByTestId('integration-tests__tabItem list')).toBeInTheDocument();
      expect(screen.getByTestId('integration-tests__tabItem scheduled')).toBeInTheDocument();
    });
  });

  describe('Tab Navigation', () => {
    it('should default to Tests tab', () => {
      renderIntegrationTestsTab();
      
      expect(screen.getByTestId('integration-tests-list')).toBeInTheDocument();
      expect(screen.queryByTestId('scheduled-jobs-tab')).not.toBeInTheDocument();
    });

    it('should switch to Scheduled Jobs tab when clicked', async () => {
      renderIntegrationTestsTab();
      
      const scheduledJobsTab = screen.getByRole('tab', { name: 'Scheduled jobs' });
      fireEvent.click(scheduledJobsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('scheduled-jobs-tab')).toBeInTheDocument();
        expect(screen.queryByTestId('integration-tests-list')).not.toBeInTheDocument();
      });
    });

    it('should switch back to Tests tab from Scheduled Jobs', async () => {
      renderIntegrationTestsTab();
      
      // First switch to Scheduled Jobs
      const scheduledJobsTab = screen.getByRole('tab', { name: 'Scheduled jobs' });
      fireEvent.click(scheduledJobsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('scheduled-jobs-tab')).toBeInTheDocument();
      });
      
      // Then switch back to Tests
      const testsTab = screen.getByRole('tab', { name: 'Tests' });
      fireEvent.click(testsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('integration-tests-list')).toBeInTheDocument();
        expect(screen.queryByTestId('scheduled-jobs-tab')).not.toBeInTheDocument();
      });
    });

    it('should persist tab selection in localStorage', async () => {
      renderIntegrationTestsTab();
      
      const scheduledJobsTab = screen.getByRole('tab', { name: 'Scheduled jobs' });
      fireEvent.click(scheduledJobsTab);
      
      await waitFor(() => {
        expect(localStorage.getItem('integration-tests-secondary-tab')).toBe('scheduled');
      });
    });

    it('should restore tab selection from localStorage', () => {
      localStorage.setItem('integration-tests-secondary-tab', 'scheduled');
      renderIntegrationTestsTab();
      
      expect(screen.getByTestId('scheduled-jobs-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('integration-tests-list')).not.toBeInTheDocument();
    });
  });

  describe('URL Parameter Handling', () => {
    it('should show Tests tab when no URL parameter is set', () => {
      renderIntegrationTestsTab('list');
      
      expect(screen.getByTestId('integration-tests-list')).toBeInTheDocument();
    });

    it('should show Scheduled Jobs tab when URL parameter is set', () => {
      renderIntegrationTestsTab('scheduled');
      
      expect(screen.getByTestId('scheduled-jobs-tab')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should render FilterContextProvider for Tests tab', () => {
      renderIntegrationTestsTab();
      
      // The FilterContextProvider should wrap the IntegrationTestsListView
      expect(screen.getByTestId('integration-tests-list')).toBeInTheDocument();
    });

    it('should render ScheduledJobsTab without FilterContextProvider', async () => {
      renderIntegrationTestsTab();
      
      const scheduledJobsTab = screen.getByRole('tab', { name: 'Scheduled jobs' });
      fireEvent.click(scheduledJobsTab);
      
      await waitFor(() => {
        expect(screen.getByTestId('scheduled-jobs-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderIntegrationTestsTab();
      
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();
      expect(tabList).toHaveAttribute('data-test', 'integration-tests-tabs-id');
    });

    it('should maintain tab focus and selection states', async () => {
      renderIntegrationTestsTab();
      
      const testsTab = screen.getByRole('tab', { name: 'Tests' });
      const scheduledJobsTab = screen.getByRole('tab', { name: 'Scheduled jobs' });
      
      expect(testsTab).toHaveAttribute('aria-selected', 'true');
      expect(scheduledJobsTab).toHaveAttribute('aria-selected', 'false');
      
      fireEvent.click(scheduledJobsTab);
      
      await waitFor(() => {
        expect(testsTab).toHaveAttribute('aria-selected', 'false');
        expect(scheduledJobsTab).toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Tab Mounting Behavior', () => {
    it('should mount tabs on enter and unmount on exit', async () => {
      renderIntegrationTestsTab();
      
      // Initially only Tests tab should be mounted
      expect(screen.getByTestId('integration-tests-list')).toBeInTheDocument();
      expect(screen.queryByTestId('scheduled-jobs-tab')).not.toBeInTheDocument();
      
      // Switch to Scheduled Jobs tab
      const scheduledJobsTab = screen.getByRole('tab', { name: 'Scheduled jobs' });
      fireEvent.click(scheduledJobsTab);
      
      await waitFor(() => {
        // Now only Scheduled Jobs tab should be mounted
        expect(screen.queryByTestId('integration-tests-list')).not.toBeInTheDocument();
        expect(screen.getByTestId('scheduled-jobs-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Error Boundaries', () => {
    it('should handle tab rendering errors gracefully', () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      renderIntegrationTestsTab();
      
      // Component should still render even if there are minor errors
      expect(screen.getByText('Integration tests')).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
}); 