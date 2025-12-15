import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
  Title,
  Divider,
  Bullseye,
  Spinner,
} from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useTaskRunV2 } from '../../../hooks/useTaskRunsV2';
import {
  APPLICATION_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  PIPELINERUN_DETAILS_PATH,
  TASKRUN_LOGS_PATH,
} from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { SyncMarkdownView } from '../../../shared/components/markdown-view/MarkdownView';
import { ErrorDetailsWithStaticLog } from '../../../shared/components/pipeline-run-logs/logs/log-snippet-types';
import { getTRLogSnippet } from '../../../shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../shared/providers/Namespace';
import { TektonResourceLabel } from '../../../types';
import {
  calculateDuration,
  isTaskV1Beta1,
  taskName,
  taskRunStatus,
} from '../../../utils/pipeline-utils';
import MetadataList from '../../MetadataList';
import RunParamsList from '../../PipelineRun/PipelineRunDetailsView/tabs/RunParamsList';
import RunResultsList from '../../PipelineRun/PipelineRunDetailsView/tabs/RunResultsList';
import ScanDescriptionListGroup from '../../PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';
import { StatusIconWithText } from '../../topology/StatusIcon';

const TaskRunDetailsTab: React.FC = () => {
  const { taskRunName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [taskRun, loaded, error] = useTaskRunV2(namespace, taskRunName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="lg" />
      </Bullseye>
    );
  }

  const taskRunFailed = (getTRLogSnippet(taskRun) || {}) as ErrorDetailsWithStaticLog;
  const results = isTaskV1Beta1(taskRun) ? taskRun?.status?.taskResults : taskRun?.status?.results;
  const hasStart = typeof taskRun?.status?.startTime === 'string' && !!taskRun.status.startTime;
  const hasEnd =
    typeof taskRun?.status?.completionTime === 'string' && !!taskRun.status.completionTime;
  const duration = hasStart
    ? calculateDuration(
        taskRun.status.startTime,
        hasEnd ? taskRun.status.completionTime : undefined,
      )
    : undefined;

  const applicationName = taskRun?.metadata?.labels?.[PipelineRunLabel.APPLICATION];
  const status = !error ? taskRunStatus(taskRun) : null;
  const plrName = taskRun?.metadata?.labels?.[TektonResourceLabel.pipelinerun];
  const specParams = taskRun?.spec?.params;

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg" size="lg">
        Task run details
      </Title>
      {!error && (
        <Flex>
          <Flex flex={{ default: 'flex_3' }}>
            <FlexItem>
              <DescriptionList
                data-test="taskrun-details"
                columnModifier={{
                  default: '1Col',
                }}
              >
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>
                    {taskRun.metadata?.name ?? '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespace</DescriptionListTerm>
                  <DescriptionListDescription>
                    {taskRun.metadata?.namespace ?? '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Labels</DescriptionListTerm>
                  <DescriptionListDescription>
                    <MetadataList metadata={taskRun.metadata?.labels} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Annotations</DescriptionListTerm>
                  <DescriptionListDescription>
                    <MetadataList metadata={taskRun.metadata?.annotations} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Created at</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp timestamp={taskRun.metadata?.creationTimestamp ?? '-'} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Duration</DescriptionListTerm>
                  <DescriptionListDescription>{duration ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </FlexItem>
          </Flex>

          <Flex flex={{ default: 'flex_3' }}>
            <FlexItem>
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
                    <SyncMarkdownView
                      content={taskRun.status?.taskSpec?.description || '-'}
                      inline
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <StatusIconWithText
                      status={status}
                      dataTestAttribute={'taskrun-details status'}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <ScanDescriptionListGroup taskRuns={[taskRun]} hideIfNotFound />
                {Object.keys(taskRunFailed).length > 0 && (
                  <>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Message</DescriptionListTerm>
                      <DescriptionListDescription>
                        {taskRunFailed.title ?? '-'}
                      </DescriptionListDescription>
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
                        {taskRun.metadata?.labels?.[PipelineRunLabel.APPLICATION]}
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
            </FlexItem>
          </Flex>
          {results ? (
            <>
              <Divider style={{ padding: 'var(--pf-v5-global--spacer--lg) 0' }} />
              <RunResultsList results={results} status={status} />
            </>
          ) : null}

          {specParams?.length && (
            <div style={{ marginTop: 'var(--pf-v5-global--spacer--lg)' }}>
              <RunParamsList params={specParams} />
            </div>
          )}
        </Flex>
      )}
    </>
  );
};

export default TaskRunDetailsTab;
