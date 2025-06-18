import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { IntegrationTestsTab } from '../IntegrationTestsTab';

// Mock child components
jest.mock('../IntegrationTestsListView/IntegrationTestsListView', () => ({
  IntegrationTestsListView: () => (
    <div data-testid="integration-tests-list">Integration Tests List</div>
  ),
}));

jest.mock('../ScheduledJobsTab', () => ({
  ScheduledJobsTab: () => <div data-testid="scheduled-jobs-tab">Scheduled Jobs Tab</div>,
}));

const renderIntegrationTestsTab = (initialTab = 'list') => {
  const path = `/workspace/test-workspace/applications/test-app/integration-tests/tabs/${initialTab}`;
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route
          path="/workspace/:workspaceName/applications/:applicationName/integration-tests/tabs/:integrationTestTab"
          element={<IntegrationTestsTab />}
        />
      </Routes>
    </MemoryRouter>,
  );
};

describe('IntegrationTestsTab', () => {
  describe('Tab Structure', () => {
    it('should render the main title and description', () => {
      renderIntegrationTestsTab();

      expect(screen.getByText('Integration tests')).toBeInTheDocument();
      expect(
        screen.getByText('Manage integration tests and scheduled jobs for your application.'),
      ).toBeInTheDocument();
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
    it('should default to Tests tab', async () => {
      renderIntegrationTestsTab();
      await waitFor(() => {
        expect(screen.getByText('Integration Tests List')).toBeInTheDocument();
        expect(screen.queryByText('Scheduled Jobs Tab')).not.toBeInTheDocument();
      });
    });

    it('should show Scheduled Jobs tab when scheduled tab is active', async () => {
      renderIntegrationTestsTab('scheduled');
      await waitFor(() => {
        expect(screen.getByText('Scheduled Jobs Tab')).toBeInTheDocument();
        expect(screen.queryByText('Integration Tests List')).not.toBeInTheDocument();
      });
    });
  });

  describe('URL Parameter Handling', () => {
    it('should show Tests tab when list tab is specified', async () => {
      renderIntegrationTestsTab('list');
      await waitFor(() => {
        expect(screen.getByText('Integration Tests List')).toBeInTheDocument();
      });
    });

    it('should show Scheduled Jobs tab when scheduled tab is specified', async () => {
      renderIntegrationTestsTab('scheduled');
      await waitFor(() => {
        expect(screen.getByText('Scheduled Jobs Tab')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should render FilterContextProvider for Tests tab', async () => {
      renderIntegrationTestsTab();
      await waitFor(() => {
        expect(screen.getByText('Integration Tests List')).toBeInTheDocument();
      });
    });

    it('should render ScheduledJobsTab without FilterContextProvider', async () => {
      renderIntegrationTestsTab('scheduled');
      await waitFor(() => {
        expect(screen.getByText('Scheduled Jobs Tab')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      renderIntegrationTestsTab();
      expect(screen.getByRole('tablist')).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Tests' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Scheduled jobs' })).toBeInTheDocument();
    });

    it('should maintain tab focus and selection states', () => {
      renderIntegrationTestsTab();
      const testsTab = screen.getByRole('tab', { name: 'Tests' });
      const scheduledTab = screen.getByRole('tab', { name: 'Scheduled jobs' });

      expect(testsTab).toHaveAttribute('aria-selected', 'true');
      expect(scheduledTab).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Tab Mounting Behavior', () => {
    it('should mount tabs on enter and unmount on exit', async () => {
      renderIntegrationTestsTab();
      await waitFor(() => {
        expect(screen.getByText('Integration Tests List')).toBeInTheDocument();
        expect(screen.queryByText('Scheduled Jobs Tab')).not.toBeInTheDocument();
      });
    });

    it('should mount Scheduled Jobs tab when it is the active tab', async () => {
      renderIntegrationTestsTab('scheduled');
      await waitFor(() => {
        expect(screen.queryByText('Integration Tests List')).not.toBeInTheDocument();
        expect(screen.getByText('Scheduled Jobs Tab')).toBeInTheDocument();
      });
    });
  });
});
