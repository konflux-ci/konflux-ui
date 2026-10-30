import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import MetadataList from '~/components/MetadataList';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { TaskRunKind } from '~/types';
import { calculateDuration } from '~/utils/pipeline-utils';

type Props = {
  taskRun: TaskRunKind;
};

const TaskRunMetadataSection: React.FC<Props> = ({ taskRun }) => {
  const hasStart = typeof taskRun?.status?.startTime === 'string' && !!taskRun.status.startTime;
  const hasEnd =
    typeof taskRun?.status?.completionTime === 'string' && !!taskRun.status.completionTime;
  const duration = hasStart
    ? calculateDuration(
        taskRun.status.startTime,
        hasEnd ? taskRun.status.completionTime : undefined,
      )
    : undefined;

  return (
    <DescriptionList
      data-test="taskrun-details"
      columnModifier={{
        default: '1Col',
      }}
    >
      <DescriptionListGroup>
        <DescriptionListTerm>Name</DescriptionListTerm>
        <DescriptionListDescription>{taskRun.metadata?.name ?? '-'}</DescriptionListDescription>
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
  );
};

export default TaskRunMetadataSection;
