import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import {
  APPLICATION_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  PIPELINERUN_DETAILS_PATH,
  TASKRUN_LOGS_PATH,
} from '@routes/paths';
import ScanDescriptionListGroup from '~/components/PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';
import { StatusIconWithText } from '~/components/topology/StatusIcon';
import { PipelineRunLabel, runStatus } from '~/consts/pipelinerun';
import { SyncMarkdownView } from '~/shared/components/markdown-view/MarkdownView';
import { ErrorDetailsWithStaticLog } from '~/shared/components/pipeline-run-logs/logs/log-snippet-types';
import { getTRLogSnippet } from '~/shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { TaskRunInfrastructureDiagnostic } from '~/shared/components/TaskRunInfrastructureDiagnostic';
import { TaskRunKind, TektonResourceLabel } from '~/types';
import { getTaskRunInfrastructureDiagnostic, taskName } from '~/utils/pipeline-utils';

type Props = {
  taskRun: TaskRunKind;
  taskRunName: string;
  applicationName?: string;
  namespace: string;
  status: runStatus | null;
};

const TaskRunDetailsSection: React.FC<Props> = ({
  taskRun,
  taskRunName,
  applicationName: routeApplicationName,
  namespace,
  status,
}) => {
  const taskRunFailed = (getTRLogSnippet(taskRun) || {}) as ErrorDetailsWithStaticLog;
  const infrastructureDiagnostic = getTaskRunInfrastructureDiagnostic(taskRun);
  const applicationName =
    routeApplicationName ?? taskRun?.metadata?.labels?.[PipelineRunLabel.APPLICATION];
  const plrName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];

  return (
    <DescriptionList
      data-test="taskrun-details"
      columnModifier={{
        default: '1Col',
      }}
    >
      {taskRun && taskName(taskRun) && (
        <DescriptionListGroup>
          <DescriptionListTerm>Task</DescriptionListTerm>
          <DescriptionListDescription>{taskName(taskRun)}</DescriptionListDescription>
        </DescriptionListGroup>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>Description</DescriptionListTerm>
        <DescriptionListDescription>
          <SyncMarkdownView content={taskRun.status?.taskSpec?.description || '-'} inline />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Status</DescriptionListTerm>
        <DescriptionListDescription>
          <StatusIconWithText status={status} dataTestAttribute={'taskrun-details status'} />
        </DescriptionListDescription>
      </DescriptionListGroup>
      <TaskRunInfrastructureDiagnostic message={infrastructureDiagnostic} />
      <ScanDescriptionListGroup taskRuns={[taskRun]} hideIfNotFound />
      {Object.keys(taskRunFailed).length > 0 && (
        <>
          <DescriptionListGroup>
            <DescriptionListTerm>Message</DescriptionListTerm>
            <DescriptionListDescription>{taskRunFailed.title ?? '-'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Log snippet</DescriptionListTerm>
            <DescriptionListDescription>
              <CodeBlock>
                <CodeBlockCode id="code-content">
                  {taskRunFailed.staticMessage ?? '-'}
                </CodeBlockCode>
              </CodeBlock>
              <Button
                variant="link"
                isInline
                component={(props) => (
                  <Link
                    {...props}
                    to={TASKRUN_LOGS_PATH.createPath({
                      taskRunName,
                      workspaceName: namespace,
                      applicationName,
                    })}
                  />
                )}
              >
                See logs
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </>
      )}
      <DescriptionListGroup>
        <DescriptionListTerm>Pipeline run</DescriptionListTerm>
        <DescriptionListDescription>
          {plrName ? (
            <Link
              to={PIPELINERUN_DETAILS_PATH.createPath({
                applicationName,
                workspaceName: namespace,
                pipelineRunName: plrName,
              })}
            >
              {plrName}
            </Link>
          ) : (
            '-'
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Application</DescriptionListTerm>
        <DescriptionListDescription>
          {applicationName ? (
            <Link
              to={APPLICATION_DETAILS_PATH.createPath({
                applicationName,
                workspaceName: namespace,
              })}
            >
              {applicationName}
            </Link>
          ) : (
            '-'
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
      <DescriptionListGroup>
        <DescriptionListTerm>Component</DescriptionListTerm>
        <DescriptionListDescription>
          {taskRun.metadata?.labels?.[PipelineRunLabel.COMPONENT] ? (
            applicationName ? (
              <Link
                to={COMPONENT_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName,
                  componentName: taskRun.metadata.labels?.[PipelineRunLabel.COMPONENT],
                })}
              >
                {taskRun.metadata.labels?.[PipelineRunLabel.COMPONENT]}
              </Link>
            ) : (
              taskRun.metadata.labels?.[PipelineRunLabel.COMPONENT]
            )
          ) : (
            '-'
          )}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default TaskRunDetailsSection;
