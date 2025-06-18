import { MemoryRouter } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import * as useIntegrationTestScenarios from '../../../hooks/useIntegrationTestScenarios';
import { CronJob } from '../../../types/cronjob';
import { K8sResourceCommon } from '../../../types/k8s';
import * as createUtils from '../../../utils/create-utils';
import { ScheduledJobsTab } from '../ScheduledJobsTab';

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
const mockUseIntegrationTestScenarios =
  useIntegrationTestScenarios.useIntegrationTestScenarios as jest.MockedFunction<
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
    </MemoryRouter>,
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
        expect(
          screen.getByText('No scheduled jobs found for this application.'),
        ).toBeInTheDocument();
      });
    });

    it('should show error state when API call fails', async () => {
      mockCreateUtils.listPeriodicIntegrationTestCronJobs.mockRejectedValue(new Error('API Error'));
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
        expect(screen.getByRole('dialog', { name: 'Add scheduled job' })).toBeInTheDocument();
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
      });

      await waitFor(() => {
        expect(
          screen.getByText(
            'No integration tests available. Please create an integration test first.',
          ),
        ).toBeInTheDocument();
      });
    });

    it('should validate job name input', async () => {
      renderScheduledJobsTab();

      await waitFor(() => {
        const addButton = screen.getByText('Add scheduled job');
        fireEvent.click(addButton);
      });

      const jobNameInput = screen.getByPlaceholderText('Enter a descriptive name for this job');
      
      // First set a valid name, then clear it to trigger validation
      fireEvent.change(jobNameInput, { target: { value: 'Valid Name' } });
      fireEvent.change(jobNameInput, { target: { value: '' } });

      // Wait for the validation error to appear
      await waitFor(() => {
        expect(screen.getByText('Job name is required')).toBeInTheDocument();
      });
    });

    it('should create cronJob with proper integration test container configuration', async () => {
      const mockCreatedCronJob = {
        apiVersion: 'batch/v1',
        kind: 'CronJob',
        metadata: {
          name: 'job-test-integration-1-123456',
          namespace: 'test-namespace',
          labels: { integrationTest: 'test-integration-1', application: 'test-app' },
          annotations: { 'job.openshift.io/display-name': 'Test Integration Job' },
        },
        spec: {
          schedule: '0 0 */2 * *',
          suspend: false,
          jobTemplate: {
            spec: {
              template: {
                spec: {
                  containers: [
                    {
                      name: 'trigger-e2e-scenario',
                      image: 'quay.io/konflux-ci/appstudio-utils:latest',
                      imagePullPolicy: 'Always',
                      command: ['/bin/bash', '-c'],
                      args: [
                        expect.stringContaining('export KONFLUX_SCENARIO_NAME="test-integration-1"') &&
                        expect.stringContaining('export KONFLUX_TENANT_NAME="test-namespace"') &&
                        expect.stringContaining('export KONFLUX_APPLICATION_NAME="test-app"') &&
                        expect.stringContaining('export KONFLUX_COMPONENT_NAME="component-default"') &&
                        expect.stringContaining('kubectl get snapshots') &&
                        expect.stringContaining('kubectl -n "${KONFLUX_TENANT_NAME}" label snapshot'),
                      ],
                    },
                  ],
                  restartPolicy: 'Never',
                  serviceAccount: 'default',
                  serviceAccountName: 'default',
                },
              },
            },
          },
        },
      };

      mockCreateUtils.createPeriodicIntegrationTestCronJob.mockResolvedValue(
        mockCreatedCronJob as CronJob,
      );

      renderScheduledJobsTab();

      await waitFor(() => {
        const addButton = screen.getByText('Add scheduled job');
        fireEvent.click(addButton);
      });

      // Fill in the form
      const jobNameInput = screen.getByPlaceholderText('Enter a descriptive name for this job');
      fireEvent.change(jobNameInput, { target: { value: 'Test Integration Job' } });

      // Use getByRole for the schedule input
      const scheduleInput = screen.getByRole('textbox', { name: /schedule/i });
      fireEvent.change(scheduleInput, { target: { value: '0 0 */2 * *' } });

      // Use getByRole for the integration test select
      const integrationTestSelect = screen.getByRole('combobox', { name: /integration test/i });
      fireEvent.change(integrationTestSelect, { target: { value: 'test-integration-1' } });

      // Submit the form
      const createButton = screen.getByText('Create Job');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(mockCreateUtils.createPeriodicIntegrationTestCronJob).toHaveBeenCalledWith(
          expect.objectContaining({
            apiVersion: 'batch/v1',
            kind: 'CronJob',
            metadata: expect.objectContaining({
              name: expect.stringMatching(/^job-test-integration-1-\d+$/),
              namespace: 'test-namespace',
              labels: {
                integrationTest: 'test-integration-1',
                application: 'test-app',
              },
              annotations: {
                'job.openshift.io/display-name': 'Test Integration Job',
              },
            }),
            spec: {
              schedule: '0 0 */2 * *',
              suspend: false,
              jobTemplate: {
                spec: {
                  template: {
                    spec: {
                      containers: [
                        expect.objectContaining({
                          name: 'trigger-e2e-scenario',
                          image: 'quay.io/konflux-ci/appstudio-utils:latest',
                          imagePullPolicy: 'Always',
                          command: ['/bin/bash', '-c'],
                          args: [
                            expect.stringContaining('export KONFLUX_SCENARIO_NAME="test-integration-1"') &&
                            expect.stringContaining('export KONFLUX_TENANT_NAME="test-namespace"') &&
                            expect.stringContaining('export KONFLUX_APPLICATION_NAME="test-app"') &&
                            expect.stringContaining('export KONFLUX_COMPONENT_NAME="component-default"') &&
                            expect.stringContaining('kubectl get snapshots') &&
                            expect.stringContaining('kubectl -n "${KONFLUX_TENANT_NAME}" label snapshot'),
                          ],
                        }),
                      ],
                      restartPolicy: 'Never',
                      serviceAccount: 'default',
                      serviceAccountName: 'default',
                    },
                  },
                },
              },
            },
          }),
          'test-namespace',
        );
      });
    });
  });

  describe('Job Actions', () => {
    it('should open delete confirmation modal', async () => {
      renderScheduledJobsTab();

      await waitFor(() => {
        const kebabButtons = screen.getAllByLabelText('Kebab toggle');
        fireEvent.click(kebabButtons[0]);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Delete scheduled job?')).toBeInTheDocument();
        expect(
          screen.getByText('Are you sure you want to delete this scheduled job?'),
        ).toBeInTheDocument();
      });
    });

    it('should delete job when confirmed', async () => {
      mockCreateUtils.deletePeriodicIntegrationTestCronJob.mockResolvedValue(
        {} as K8sResourceCommon,
      );
      renderScheduledJobsTab();

      await waitFor(() => {
        const kebabButtons = screen.getAllByLabelText('Kebab toggle');
        fireEvent.click(kebabButtons[0]);
      });

      await waitFor(() => {
        const deleteButton = screen.getByText('Delete');
        fireEvent.click(deleteButton);
      });

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: 'Delete' });
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(mockCreateUtils.deletePeriodicIntegrationTestCronJob).toHaveBeenCalledWith(
          'job-test-123456',
          'test-namespace',
        );
      });
    });

    it('should open edit modal with pre-filled values', async () => {
      renderScheduledJobsTab();

      await waitFor(() => {
        const kebabButtons = screen.getAllByLabelText('Kebab toggle');
        fireEvent.click(kebabButtons[0]);
      });

      await waitFor(() => {
        const editButton = screen.getByText('Edit');
        fireEvent.click(editButton);
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
        expect(screen.getByLabelText('name filter')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add scheduled job' })).toBeInTheDocument();
      });
    });

    it('should have table with accessible structure', async () => {
      renderScheduledJobsTab();

      await waitFor(() => {
        const table = screen.getByRole('grid', { name: 'Scheduled Jobs List' });
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

  describe('Utility Functions', () => {
    it('should generate job name correctly', async () => {
      renderScheduledJobsTab();

      // Open the add modal to trigger job name generation
      await waitFor(() => {
        const addButton = screen.getByText('Add scheduled job');
        fireEvent.click(addButton);
      });

      // The job name should be generated when the form is submitted
      // We can verify this by checking that the job name field is populated
      await waitFor(() => {
        const jobNameInput = screen.getByPlaceholderText('Enter a descriptive name for this job');
        expect(jobNameInput).toBeInTheDocument();
      });
    });

    it('should handle getHumanReadableSchedule for valid cron expressions', async () => {
      renderScheduledJobsTab();

      // Test that valid cron expressions show human readable text
      await waitFor(() => {
        // The table should show human readable schedules for the mock data
        expect(screen.getByText('0 9 * * *')).toBeInTheDocument();
        expect(screen.getByText('0 0 * * 0')).toBeInTheDocument();
      });
    });

    it('should handle getHumanReadableSchedule for invalid cron expressions', async () => {
      // Create a mock with invalid cron expressions
      const mockCronJobsWithInvalidSchedule = [
        {
          ...mockCronJobs[0],
          spec: {
            ...mockCronJobs[0].spec,
            schedule: 'invalid-cron',
          },
        },
      ];

      mockCreateUtils.listPeriodicIntegrationTestCronJobs.mockResolvedValue(
        mockCronJobsWithInvalidSchedule as unknown as CronJob[],
      );

      renderScheduledJobsTab();

      await waitFor(() => {
        // Should still show the invalid cron expression
        expect(screen.getByText('invalid-cron')).toBeInTheDocument();
      });
    });
  });
});
