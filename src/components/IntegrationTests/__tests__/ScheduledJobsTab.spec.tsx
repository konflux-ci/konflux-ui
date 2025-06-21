import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as useIntegrationTestScenarios from '../../../hooks/useIntegrationTestScenarios';
import * as createUtils from '../../../utils/create-utils';
import { ScheduledJobsTab } from '../ScheduledJobsTab';
import { CronJob } from '../../../types/cronjob';

// Mock dependencies
jest.mock('../../../utils/create-utils');
jest.mock('../../../hooks/useIntegrationTestScenarios');
jest.mock('../../../shared/providers/Namespace', () => ({
  useNamespace: () => 'test-namespace',
}));
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ applicationName: 'test-app' }),
}));

const mockCreateUtils = createUtils as jest.Mocked<typeof createUtils>;
const mockUseIntegrationTestScenarios = useIntegrationTestScenarios.useIntegrationTestScenarios as jest.MockedFunction<
  typeof useIntegrationTestScenarios.useIntegrationTestScenarios
>;

// Mock data with minimal required properties
const mockIntegrationTests = [
  {
    apiVersion: 'appstudio.redhat.com/v1beta1',
    kind: 'IntegrationTestScenario',
    metadata: { name: 'test-integration-1', namespace: 'test-ns' },
    spec: { application: 'test-app' },
  },
  {
    apiVersion: 'appstudio.redhat.com/v1beta1',
    kind: 'IntegrationTestScenario',
    metadata: { name: 'test-integration-2', namespace: 'test-ns' },
    spec: { application: 'test-app' },
  },
];

const mockCronJobs = [
  {
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    metadata: {
      name: 'job-test-123456',
      namespace: 'test-ns',
      labels: { integrationTest: 'test-integration-1', application: 'test-app' },
      annotations: { 'job.openshift.io/display-name': 'Test Job 1' },
    },
    spec: {
      schedule: '0 9 * * *',
      suspend: false,
    },
  },
  {
    apiVersion: 'batch/v1',
    kind: 'CronJob',
    metadata: {
      name: 'job-test-789012',
      namespace: 'test-ns',
      labels: { integrationTest: 'test-integration-2', application: 'test-app' },
      annotations: { 'job.openshift.io/display-name': 'Test Job 2' },
    },
    spec: {
      schedule: '0 0 * * 0',
      suspend: true,
    },
  },
] as unknown as CronJob[];

const renderScheduledJobsTab = () => {
  return render(
    <MemoryRouter>
      <ScheduledJobsTab />
    </MemoryRouter>
  );
};

describe('ScheduledJobsTab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIntegrationTestScenarios.mockReturnValue([mockIntegrationTests, true, undefined]);
    mockCreateUtils.listPeriodicIntegrationTestCronJobs.mockResolvedValue(mockCronJobs);
  });

  describe('Loading States', () => {
    it('should show loading spinner when integration tests are not loaded', () => {
      mockUseIntegrationTestScenarios.mockReturnValue([[], false, undefined]);
      renderScheduledJobsTab();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    it('should show empty state when no scheduled jobs exist', async () => {
      mockCreateUtils.listPeriodicIntegrationTestCronJobs.mockResolvedValue([]);
      renderScheduledJobsTab();
      
      await waitFor(() => {
        expect(screen.getByText('No scheduled jobs found for this application.')).toBeInTheDocument();
      });
    });

    it('should show error state when API call fails', async () => {
      mockCreateUtils.listPeriodicIntegrationTestCronJobs.mockRejectedValue(
        new Error('API Error')
      );
      renderScheduledJobsTab();
      
      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });
  });

  describe('Job List Display', () => {
    it('should render table with scheduled jobs', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        expect(screen.getByText('Test Job 1')).toBeInTheDocument();
        expect(screen.getByText('Test Job 2')).toBeInTheDocument();
        expect(screen.getByText('test-integration-1')).toBeInTheDocument();
        expect(screen.getByText('test-integration-2')).toBeInTheDocument();
        expect(screen.getByText('0 9 * * *')).toBeInTheDocument();
        expect(screen.getByText('0 0 * * 0')).toBeInTheDocument();
      });
    });

    it('should show suspend status correctly', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        expect(screen.getByText('No')).toBeInTheDocument(); // First job not suspended
        expect(screen.getByText('Yes')).toBeInTheDocument(); // Second job suspended
      });
    });

    it('should filter jobs by search text', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        expect(screen.getByText('Test Job 1')).toBeInTheDocument();
        expect(screen.getByText('Test Job 2')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Filter by name...');
      fireEvent.change(searchInput, { target: { value: 'job-test-123456' } });

      await waitFor(() => {
        expect(screen.getByText('Test Job 1')).toBeInTheDocument();
        expect(screen.queryByText('Test Job 2')).not.toBeInTheDocument();
      });
    });
  });

  describe('Add Job Modal', () => {
    it('should open add modal when clicking Add scheduled job button', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const addButton = screen.getByText('Add scheduled job');
        fireEvent.click(addButton);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Integration Test')).toBeInTheDocument();
        expect(screen.getByText('Job Name')).toBeInTheDocument();
        expect(screen.getByText('Schedule (cron)')).toBeInTheDocument();
      });
    });

    it('should show error when no integration tests are available', async () => {
      mockUseIntegrationTestScenarios.mockReturnValue([[], true, undefined]);
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const addButton = screen.getByText('Add scheduled job');
        fireEvent.click(addButton);
        
        expect(screen.getByText('No integration tests available. Please create an integration test first.')).toBeInTheDocument();
      });
    });

    it('should validate job name input', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const addButton = screen.getByText('Add scheduled job');
        fireEvent.click(addButton);
      });

      const jobNameInput = screen.getByPlaceholderText('Enter a descriptive name for this job');
      
      // Test empty name
      fireEvent.change(jobNameInput, { target: { value: '' } });
      await waitFor(() => {
        expect(screen.getByText('Job name is required')).toBeInTheDocument();
      });

      // Test short name
      fireEvent.change(jobNameInput, { target: { value: 'ab' } });
      await waitFor(() => {
        expect(screen.getByText('Job name must be at least 3 characters long')).toBeInTheDocument();
      });

      // Test valid name
      fireEvent.change(jobNameInput, { target: { value: 'Valid Job Name' } });
      await waitFor(() => {
        expect(screen.queryByText('Job name is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Job Actions', () => {
    it('should open delete confirmation modal', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Delete scheduled job?')).toBeInTheDocument();
        expect(screen.getByText('Are you sure you want to delete this scheduled job?')).toBeInTheDocument();
      });
    });

    it('should delete job when confirmed', async () => {
      mockCreateUtils.deletePeriodicIntegrationTestCronJob.mockResolvedValue({} as unknown);
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const deleteButtons = screen.getAllByText('Delete');
        fireEvent.click(deleteButtons[0]);
      });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockCreateUtils.deletePeriodicIntegrationTestCronJob).toHaveBeenCalledWith(
          'job-test-123456',
          'test-namespace'
        );
      });
    });

    it('should open edit modal with pre-filled values', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const editButtons = screen.getAllByText('Edit');
        fireEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit scheduled job')).toBeInTheDocument();
        expect(screen.getByDisplayValue('0 9 * * *')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        expect(screen.getByLabelText('Filter by name...')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add scheduled job' })).toBeInTheDocument();
      });
    });

    it('should have table with accessible structure', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        const table = screen.getByRole('table', { name: 'Scheduled Jobs List' });
        expect(table).toBeInTheDocument();
      });
    });
  });

  describe('Human Readable Schedule', () => {
    it('should display human readable cron schedule', async () => {
      renderScheduledJobsTab();
      
      await waitFor(() => {
        // These are approximate human-readable versions - the exact text may vary
        expect(screen.getByText(/09:00/)).toBeInTheDocument();
        expect(screen.getByText(/Sunday/)).toBeInTheDocument();
      });
    });
  });
}); 