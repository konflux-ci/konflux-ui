import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Divider,
} from '@patternfly/react-core';
import { runStatus } from '~/consts/pipelinerun';
import { SyncMarkdownView, Timestamp } from '../../../../shared';
import { TaskRunKind } from '../../../../types';
import { calculateDuration, isTaskV1Beta1 } from '../../../../utils/pipeline-utils';
import RunParamsList from '../tabs/RunParamsList';
import RunResultsList from '../tabs/RunResultsList';
import ScanDescriptionListGroup from '../tabs/ScanDescriptionListGroup';

type Props = {
  taskRun?: TaskRunKind;
  status: runStatus;
};

const TaskRunDetails: React.FC<React.PropsWithChildren<Props>> = ({ taskRun, status }) => {
  const results = isTaskV1Beta1(taskRun) ? taskRun?.status?.taskResults : taskRun?.status?.results;
  const specParams = taskRun?.spec?.params;
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
          <DescriptionList className="pf-v5-u-mt-lg">
            <DescriptionListGroup>
              <DescriptionListTerm>Description</DescriptionListTerm>
              <DescriptionListDescription>
                <SyncMarkdownView content={taskRun?.status?.taskSpec?.description || '-'} inline />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <ScanDescriptionListGroup taskRuns={[taskRun]} hideIfNotFound />
          </DescriptionList>
        </>
      ) : (
        'This task was skipped.'
      )}
      {results?.length ? (
        <>
          <br />
          <RunResultsList status={status} results={results} compressed />
        </>
      ) : null}

      {specParams?.length && (
        <>
          <Divider style={{ padding: 'var(--pf-v5-global--spacer--lg) 0' }} />
          <RunParamsList params={specParams} compressed />
        </>
      )}
    </>
  );
};

export default TaskRunDetails;
