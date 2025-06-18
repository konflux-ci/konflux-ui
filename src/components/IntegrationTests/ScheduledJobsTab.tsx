import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  Spinner,
  Button,
  EmptyState,
  EmptyStateBody,
  Modal,
  Form,
  FormGroup,
  TextInput,
  Checkbox,
  Alert,
  AlertVariant,
  AlertGroup,
} from '@patternfly/react-core';
import { ActionsColumn, IAction } from '@patternfly/react-table';
import cronstrue from 'cronstrue';
import { useIntegrationTestScenarios } from '../../hooks/useIntegrationTestScenarios';
import { k8sPatchResource } from '../../k8s/k8s-fetch';
import { CronJobModel } from '../../models';
import { RouterParams } from '../../routes/utils';
import { Table, TableData, RowFunctionArgs } from '../../shared';
import { useNamespace } from '../../shared/providers/Namespace';
import { CronJob } from '../../types/cronjob';
import {
  createPeriodicIntegrationTestCronJob,
  deletePeriodicIntegrationTestCronJob,
  listPeriodicIntegrationTestCronJobs,
} from '../../utils/create-utils';
import { validateCronExpression, sanitizeCronInput } from '../../utils/cron-validation';
import { useAccessReviewForModel } from '../../utils/rbac';
import { BaseTextFilterToolbar } from '../Filter/toolbars/BaseTextFIlterToolbar';

export const ScheduledJobsTab: React.FC = () => {
  const namespace = useNamespace();
  const { applicationName } = useParams<RouterParams>();
  const [integrationTests, integrationTestsLoaded] = useIntegrationTestScenarios(
    namespace,
    applicationName,
  );

  // Add permission check for CronJob creation
  const [canCreateCronJob, canCreateCronJobLoaded] = useAccessReviewForModel(
    CronJobModel,
    'create',
  );
  const [canUpdateCronJob] = useAccessReviewForModel(CronJobModel, 'update');
  const [canDeleteCronJob] = useAccessReviewForModel(CronJobModel, 'delete');

  const [cronJobs, setCronJobs] = React.useState<CronJob[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [schedule, setSchedule] = React.useState('');
  const [suspend, setSuspend] = React.useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = React.useState(false);
  const [jobToDelete, setJobToDelete] = React.useState<string | null>(null);
  const [showSuccess, setShowSuccess] = React.useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingJob, setEditingJob] = React.useState<CronJob | null>(null);
  const [editSchedule, setEditSchedule] = React.useState('');
  const [editSuspend, setEditSuspend] = React.useState(false);
  const [editModalLoading, setEditModalLoading] = React.useState(false);
  const [editModalError, setEditModalError] = React.useState('');
  const [editScheduleValid, setEditScheduleValid] = React.useState(true);
  const [scheduleError, setScheduleError] = React.useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [searchText, setSearchText] = React.useState('');
  const [selectedIntegrationTest, setSelectedIntegrationTest] = React.useState<string>('');
  const [jobName, setJobName] = React.useState('');
  const [jobNameError, setJobNameError] = React.useState<string | undefined>(undefined);

  const validateSchedule = (value: string) => {
    const sanitized = sanitizeCronInput(value);
    return validateCronExpression(sanitized);
  };

  const validateJobName = (name: string): { isValid: boolean; error?: string } => {
    if (!name || name.trim() === '') {
      return { isValid: false, error: 'Job name is required' };
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 3) {
      return { isValid: false, error: 'Job name must be at least 3 characters long' };
    }

    if (trimmedName.length > 50) {
      return { isValid: false, error: 'Job name must be no more than 50 characters long' };
    }

    // Only allow alphanumeric characters, spaces, hyphens, and underscores
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmedName)) {
      return {
        isValid: false,
        error: 'Job name can only contain letters, numbers, spaces, hyphens, and underscores',
      };
    }

    return { isValid: true };
  };

  const handleScheduleChange = (value: string) => {
    // Store the raw input value without sanitizing on every keystroke
    setSchedule(value);

    // Only validate if the expression has at least 5 parts
    const sanitized = sanitizeCronInput(value);
    const parts = sanitized.trim().split(/\s+/);
    if (parts.length >= 5) {
      const isValid = validateSchedule(sanitized);
      setScheduleError(isValid ? undefined : 'Invalid cron schedule');
    } else {
      // Clear error for partial expressions
      setScheduleError(undefined);
    }
  };

  const handleJobNameChange = (value: string) => {
    setJobName(value);
    const validation = validateJobName(value);
    setJobNameError(validation.isValid ? undefined : validation.error);
  };

  function extractCronJobs(jobs: unknown): CronJob[] {
    if (!jobs || !Array.isArray(jobs)) {
      return [];
    }
    return jobs.filter((job) => job && job.metadata && job.spec);
  }

  const loadCronJobs = React.useCallback(async () => {
    if (!integrationTestsLoaded || integrationTests.length === 0) {
      return;
    }

    try {
      const labelSelector = `application=${applicationName}`;
      const jobs = await listPeriodicIntegrationTestCronJobs(namespace, labelSelector);
      const extractedJobs = extractCronJobs(jobs);
      setCronJobs(extractedJobs);
    } catch (err) {
      setError((err as Error).message || 'Failed to load jobs');
    }
  }, [namespace, applicationName, integrationTestsLoaded, integrationTests.length]);

  React.useEffect(() => {
    void loadCronJobs();
  }, [loadCronJobs]);

  const handleDelete = (name: string) => {
    setJobToDelete(name);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setJobToDelete(null);
  };

  const confirmDelete = async () => {
    if (!jobToDelete) return;

    setDeleting(jobToDelete);
    try {
      await deletePeriodicIntegrationTestCronJob(jobToDelete, namespace);
      setCronJobs(cronJobs.filter((job) => job.metadata.name !== jobToDelete));
      setShowSuccess('Scheduled job deleted successfully.');
    } catch (deleteError) {
      setError((deleteError as Error).message || 'Failed to delete job');
    } finally {
      setDeleting(null);
      closeDeleteModal();
    }
  };

  const handleOpenModal = () => {
    if (integrationTests.length === 0) {
      setError('No integration tests available. Please create an integration test first.');
      return;
    }
    setSchedule('');
    setSuspend(false);
    setJobName('');
    setJobNameError(undefined);
    setSelectedIntegrationTest(integrationTests[0].metadata.name);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const generateJobName = (integrationTestName: string): string => {
    // Create a shorter name: job-{short-test-name}-{timestamp}
    // Limit integration test name to 20 chars to leave room for prefix and timestamp
    // Remove any trailing dashes and replace internal dashes with hyphens
    const shortTestName = integrationTestName
      .substring(0, 20)
      .replace(/-+$/, '') // Remove trailing dashes
      .replace(/[^a-zA-Z0-9]/g, '-') // Replace non-alphanumeric chars with single dash
      .replace(/-+/g, '-') // Replace multiple consecutive dashes with single dash
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

    const timestamp = Date.now().toString().slice(-6); // Use last 6 digits of timestamp
    return `job-${shortTestName}-${timestamp}`;
  };

  const handleSubmit = async () => {
    if (!selectedIntegrationTest) {
      setError('Please select an integration test');
      return;
    }

    // Validate job name
    const nameValidation = validateJobName(jobName);
    if (!nameValidation.isValid) {
      setJobNameError(nameValidation.error);
      return;
    }

    // Sanitize the schedule before creating the job
    const sanitizedSchedule = sanitizeCronInput(schedule);

    setIsSubmitting(true);
    try {
      const newJob = await createPeriodicIntegrationTestCronJob(
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          metadata: {
            name: generateJobName(selectedIntegrationTest),
            namespace,
            labels: {
              integrationTest: selectedIntegrationTest,
              application: applicationName,
            },
            annotations: {
              'job.openshift.io/display-name': jobName.trim(),
            },
          },
          spec: {
            schedule: sanitizedSchedule,
            suspend,
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
                          `#!/bin/bash
set -euo pipefail

export KONFLUX_SCENARIO_NAME="${selectedIntegrationTest}"
export KONFLUX_TENANT_NAME="${namespace}"
export KONFLUX_APPLICATION_NAME="${applicationName}"
export KONFLUX_COMPONENT_NAME="component-default"

echo -e "[INFO] Fetching latest snapshot from \${KONFLUX_TENANT_NAME} related to push events."

LATEST_SNAPSHOT=$(kubectl get snapshots -n "\${KONFLUX_TENANT_NAME}" -o json | \
    jq --arg application "\${KONFLUX_APPLICATION_NAME}" --arg -r '
        .items
        | map(select(
            .metadata.labels."appstudio.openshift.io/application" == $application and
            .metadata.labels."pac.test.appstudio.openshift.io/event-type" == "push" and
            (.status.conditions // [] | map(select(
                .type == "AutoReleased" and
                .reason == "AutoReleased" and
                .status == "True"
                ))
            | length > 0)
            ))
        | sort_by(.metadata.creationTimestamp) | last | .metadata.name')


if [[ -z "\${LATEST_SNAPSHOT}" || "\${LATEST_SNAPSHOT}" == "null" ]]; then
  echo -e "[ERROR] No valid snapshot found. The job will not be triggered."
  exit 1
fi

echo -e "[INFO] Triggering test scenario \${KONFLUX_SCENARIO_NAME} from snapshot \${LATEST_SNAPSHOT}."

kubectl -n "\${KONFLUX_TENANT_NAME}" label snapshot "\${LATEST_SNAPSHOT}" test.appstudio.openshift.io/run="\${KONFLUX_SCENARIO_NAME}"

echo "[INFO] Integration Service E2E tests successfully triggered!"`,
                        ],
                      },
                    ],
                    serviceAccountName: 'konflux-cron-sa',
                    restartPolicy: 'Never',
                  },
                },
              },
            },
          },
        },
        namespace,
      );
      setCronJobs([...cronJobs, newJob]);
      setShowSuccess('Scheduled job created successfully.');
      handleCloseModal();
    } catch (createError) {
      setError((createError as Error).message || 'Failed to create job');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getHumanReadableSchedule = (cron: string): string => {
    if (!cron || cron.trim() === '') {
      return 'No schedule';
    }

    // Sanitize the input before processing
    const sanitized = sanitizeCronInput(cron);

    // Check if the cron expression has at least 5 parts
    const parts = sanitized.trim().split(/\s+/);
    if (parts.length < 5) {
      return 'Invalid schedule';
    }

    try {
      return cronstrue.toString(sanitized);
    } catch (parseError) {
      // Failed to parse cron expression
      return 'Invalid schedule';
    }
  };

  const getActions = (job: CronJob): IAction[] => [
    {
      title: 'Edit',
      onClick: () => {
        setEditingJob(job);
        setEditSchedule(job.spec.schedule);
        setEditSuspend(job.spec.suspend || false);
        setEditModalError('');
        setIsEditModalOpen(true);
      },
      isDisabled: !canUpdateCronJob,
    },
    {
      title: 'Delete',
      onClick: () => handleDelete(job.metadata.name),
      isDisabled: !canDeleteCronJob,
    },
  ];

  const handleEditScheduleChange = (_e: React.FormEvent<HTMLInputElement>, v: string) => {
    // Store the raw input value without sanitizing on every keystroke
    setEditSchedule(v);

    // Only validate if the expression has at least 5 parts
    const sanitized = sanitizeCronInput(v);
    const parts = sanitized.trim().split(/\s+/);
    if (parts.length >= 5) {
      const isValid = validateCronExpression(sanitized);
      setEditScheduleValid(isValid);
    } else {
      // Don't set validation state for partial expressions
      setEditScheduleValid(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditingJob(null);
    setEditSchedule('');
    setEditSuspend(false);
    setEditModalError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;

    // Sanitize the schedule before updating the job
    const sanitizedSchedule = sanitizeCronInput(editSchedule);

    setEditModalLoading(true);
    try {
      const patchData = [
        {
          op: 'replace',
          path: '/spec/schedule',
          value: sanitizedSchedule,
        },
        {
          op: 'replace',
          path: '/spec/suspend',
          value: editSuspend,
        },
      ];

      await k8sPatchResource({
        model: CronJobModel,
        patches: patchData,
        queryOptions: {
          ns: namespace,
          name: editingJob.metadata.name,
        },
      });

      setCronJobs(
        cronJobs.map((job) =>
          job.metadata.name === editingJob.metadata.name
            ? { ...job, spec: { ...job.spec, schedule: sanitizedSchedule, suspend: editSuspend } }
            : job,
        ),
      );

      setShowSuccess('Scheduled job updated successfully.');
      handleCloseEditModal();
    } catch (editError) {
      setEditModalError((editError as Error).message || 'Failed to update job');
    } finally {
      setEditModalLoading(false);
    }
  };

  const getTableHeader = () => [
    {
      title: 'Name',
      props: { className: 'pf-m-width-25' },
    },
    {
      title: 'Integration Test',
      props: { className: 'pf-m-width-25' },
    },
    {
      title: 'Schedule',
      props: { className: 'pf-m-width-30' },
    },
    {
      title: 'Suspended',
      props: { className: 'pf-m-width-10' },
    },
    {
      title: ' ',
      props: { className: 'pf-v5-c-table__action' },
    },
  ];

  const ScheduledJobsTableRow: React.FC<React.PropsWithChildren<RowFunctionArgs<CronJob>>> = ({
    obj,
  }) => (
    <>
      <TableData className="pf-m-width-25">
        {obj.metadata.annotations?.['job.openshift.io/display-name'] || obj.metadata.name}
      </TableData>
      <TableData className="pf-m-width-25">
        {obj.metadata.labels?.integrationTest || 'Unknown'}
      </TableData>
      <TableData className="pf-m-width-30">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <code style={{ fontSize: '14px' }}>{obj.spec.schedule}</code>
          <span style={{ color: '#6a6e73', fontSize: '14px' }}>
            {getHumanReadableSchedule(obj.spec.schedule)}
          </span>
        </div>
      </TableData>
      <TableData className="pf-m-width-10">{obj.spec.suspend ? 'Yes' : 'No'}</TableData>
      <TableData className="pf-v5-c-table__action">
        <ActionsColumn items={getActions(obj)} />
      </TableData>
    </>
  );

  const filteredCronJobs = React.useMemo(() => {
    const lower = searchText.toLowerCase();
    return cronJobs.filter((job) => job.metadata.name.toLowerCase().includes(lower));
  }, [cronJobs, searchText]);

  if (!integrationTestsLoaded || !canCreateCronJobLoaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return (
      <EmptyState>
        <EmptyStateBody>{error}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <div data-testid="scheduled-jobs-tab">
      <BaseTextFilterToolbar
        text={searchText}
        label="name"
        setText={setSearchText}
        onClearFilters={() => setSearchText('')}
        dataTest="scheduled-jobs-list-toolbar"
      >
        <Button
          variant="primary"
          onClick={handleOpenModal}
          style={{ marginLeft: 8 }}
          isDisabled={!canCreateCronJob}
        >
          Add scheduled job
        </Button>
      </BaseTextFilterToolbar>
      <Modal
        title="Add scheduled job"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        variant="small"
        actions={[
          <Button
            key="submit"
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={
              isSubmitting ||
              !schedule.trim() ||
              !selectedIntegrationTest ||
              !jobName.trim() ||
              !!jobNameError ||
              !!scheduleError ||
              !canCreateCronJob
            }
          >
            Create Job
          </Button>,
          <Button key="cancel" variant="link" onClick={handleCloseModal} isDisabled={isSubmitting}>
            Cancel
          </Button>,
        ]}
      >
        <Form onSubmit={handleSubmit} isWidthLimited>
          <FormGroup label="Integration Test" isRequired fieldId="integration-test">
            <select
              id="integration-test"
              value={selectedIntegrationTest}
              onChange={(e) => setSelectedIntegrationTest(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            >
              {integrationTests.map((test) => (
                <option key={test.metadata.name} value={test.metadata.name}>
                  {test.metadata.name}
                </option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Job Name" isRequired fieldId="job-name">
            <TextInput
              id="job-name"
              value={jobName}
              onChange={(_event, value) => handleJobNameChange(value)}
              validated={jobNameError ? 'error' : 'default'}
              required
              placeholder="Enter a descriptive name for this job"
            />
            <div style={{ fontSize: '12px', color: '#6a6e73', marginTop: '4px' }}>
              {jobNameError ? (
                <span style={{ color: '#c9190b' }}>{jobNameError}</span>
              ) : (
                'Enter a descriptive name (3-50 characters, letters, numbers, spaces, hyphens, and underscores only)'
              )}
            </div>
          </FormGroup>
          <FormGroup label="Schedule (cron)" isRequired fieldId="schedule">
            <TextInput
              id="schedule"
              value={schedule}
              onChange={(_event, value) => handleScheduleChange(value)}
              validated={scheduleError ? 'error' : 'default'}
              required
            />
            <div style={{ fontSize: '12px', color: '#6a6e73', marginTop: '4px' }}>
              {scheduleError ? (
                <span style={{ color: '#c9190b' }}>{scheduleError}</span>
              ) : (
                <>
                  Use standard cron syntax. Example: 0 0 * * * for daily at midnight.
                  {schedule && (
                    <div style={{ marginTop: '4px' }}>
                      <strong>Human:</strong> {getHumanReadableSchedule(schedule)}
                    </div>
                  )}
                </>
              )}
            </div>
          </FormGroup>
          <FormGroup fieldId="suspend">
            <Checkbox
              id="suspend"
              label="Suspend job"
              isChecked={suspend}
              onChange={(_e, v) => setSuspend(v)}
            />
          </FormGroup>
        </Form>
      </Modal>
      {showSuccess && (
        <AlertGroup isToast style={{ position: 'fixed', top: 16, right: 16, zIndex: 9999 }}>
          <Alert
            variant={AlertVariant.success}
            title={showSuccess}
            timeout={4000}
            onTimeout={() => setShowSuccess(null)}
          />
        </AlertGroup>
      )}
      {Array.isArray(filteredCronJobs) && filteredCronJobs.length === 0 ? (
        <EmptyState>
          <EmptyStateBody>No scheduled jobs found for this application.</EmptyStateBody>
        </EmptyState>
      ) : Array.isArray(filteredCronJobs) && filteredCronJobs.length > 0 ? (
        <Table
          data={filteredCronJobs}
          aria-label="Scheduled Jobs List"
          Header={getTableHeader}
          Row={ScheduledJobsTableRow}
          loaded
          virtualize={false}
          getRowProps={(obj: CronJob) => ({
            id: obj.metadata?.name,
          })}
        />
      ) : null}
      <Modal
        title="Delete scheduled job?"
        isOpen={deleteModalOpen}
        onClose={closeDeleteModal}
        variant="small"
        actions={[
          <Button
            key="confirm"
            variant="danger"
            onClick={confirmDelete}
            isLoading={!!deleting}
            isDisabled={!!deleting}
          >
            Delete
          </Button>,
          <Button key="cancel" variant="link" onClick={closeDeleteModal} isDisabled={!!deleting}>
            Cancel
          </Button>,
        ]}
      >
        Are you sure you want to delete this scheduled job?
      </Modal>
      <Modal
        title="Edit scheduled job"
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        variant="small"
        actions={[
          <Button
            key="submit"
            variant="primary"
            onClick={handleEditSubmit}
            isLoading={editModalLoading}
            isDisabled={editModalLoading || !editScheduleValid || !editSchedule.trim()}
          >
            Save
          </Button>,
          <Button
            key="cancel"
            variant="link"
            onClick={handleCloseEditModal}
            isDisabled={editModalLoading}
          >
            Cancel
          </Button>,
        ]}
      >
        {editModalError && (
          <Alert variant="danger" title={editModalError} isInline style={{ marginBottom: 16 }} />
        )}
        <Form onSubmit={handleEditSubmit} isWidthLimited>
          <FormGroup label="Schedule (cron)" isRequired fieldId="edit-schedule">
            <TextInput
              id="edit-schedule"
              value={editSchedule}
              onChange={handleEditScheduleChange}
              isRequired
              validated={editScheduleValid ? 'default' : 'error'}
              aria-describedby="edit-schedule-helper"
            />
            <div
              id="edit-schedule-helper"
              style={{ fontSize: 12, color: editScheduleValid ? '#6a6e73' : '#c9190b' }}
            >
              {editScheduleValid ? (
                <>
                  Use standard cron syntax. Example: <code>0 0 * * *</code> for daily at midnight.
                </>
              ) : (
                <>{editModalError || 'Invalid cron schedule.'}</>
              )}
            </div>
            {editSchedule.trim() && (
              <div style={{ fontSize: 12, color: '#3e8635', marginTop: 4 }}>
                <strong>Human:</strong> {getHumanReadableSchedule(editSchedule)}
              </div>
            )}
          </FormGroup>
          <FormGroup fieldId="edit-suspend">
            <Checkbox
              id="edit-suspend"
              label="Suspend job"
              isChecked={editSuspend}
              onChange={(_e, v) => setEditSuspend(v)}
            />
          </FormGroup>
        </Form>
      </Modal>
    </div>
  );
};
