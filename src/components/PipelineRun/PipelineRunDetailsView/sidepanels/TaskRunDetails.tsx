import * as React from 'react';
import {
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
} from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import {
  calculateDuration,
  getTaskRunInfrastructureDiagnostic,
  isTaskV1Beta1,
} from '~/utils/pipeline-utils';
import { SyncMarkdownView, Timestamp } from '../../../../shared';
import { TaskRunKind } from '../../../../types';
import RunParamsList from '../tabs/RunParamsList';
import RunResultsList from '../tabs/RunResultsList';
import ScanDescriptionListGroup from '../tabs/ScanDescriptionListGroup';

type Props = {
  taskRun?: TaskRunKind;
  status: runStatus;
  description?: string;
};

const TaskDescriptionGroup: React.FC<{ content: string }> = ({ content }) => (
  <DescriptionListGroup>
    <DescriptionListTerm>Description</DescriptionListTerm>
    <DescriptionListDescription>
      <SyncMarkdownView content={content} inline />
    </DescriptionListDescription>
  </DescriptionListGroup>
);

const getTaskDescription = (
  taskRun: TaskRunKind | undefined,
  pipelineTaskDescription: string | undefined,
): string => {
  const taskSpecDescription = taskRun?.status?.taskSpec?.description?.trim();
  const trimmedPipelineDescription = pipelineTaskDescription?.trim();

  return taskSpecDescription || trimmedPipelineDescription || '-';
};

const TaskRunDetails: React.FC<React.PropsWithChildren<Props>> = ({
  taskRun,
  status,
  description,
}) => {
  const results = isTaskV1Beta1(taskRun) ? taskRun?.status?.taskResults : taskRun?.status?.results;
  const specParams = taskRun?.spec?.params;
  const taskDescription = getTaskDescription(taskRun, description);
  const infrastructureDiagnostic = getTaskRunInfrastructureDiagnostic(taskRun);
  return (
    <>
      {status !== runStatus.Skipped ? (
        <>
          <DescriptionList columnModifier={{ default: '2Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>Started</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={taskRun?.status?.startTime} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>
                {taskRun?.status?.startTime
                  ? calculateDuration(taskRun.status?.startTime, taskRun.status?.completionTime)
                  : '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
          <DescriptionList className="pf-v6-u-mt-lg">
            <TaskDescriptionGroup content={taskDescription} />
            {infrastructureDiagnostic && (
              <DescriptionListGroup>
                <DescriptionListTerm>Infrastructure diagnostic</DescriptionListTerm>
                <DescriptionListDescription>
                  <CodeBlock>
                    <CodeBlockCode style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                      {infrastructureDiagnostic}
                    </CodeBlockCode>
                  </CodeBlock>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <ScanDescriptionListGroup taskRuns={[taskRun]} hideIfNotFound />
          </DescriptionList>
        </>
      ) : (
        <>
          <p>This task was skipped.</p>
          {taskDescription !== '-' ? (
            <DescriptionList className="pf-v6-u-mt-lg">
              <TaskDescriptionGroup content={taskDescription} />
            </DescriptionList>
          ) : null}
        </>
      )}
      {results?.length ? (
        <>
          <br />
          <RunResultsList status={status} results={results} compressed />
        </>
      ) : null}

      {specParams?.length && (
        <>
          <Divider className="pf-v6-u-mt-lg pf-v6-u-mb-lg" />
          <RunParamsList params={specParams} compressed />
        </>
      )}
    </>
  );
};

export default TaskRunDetails;
