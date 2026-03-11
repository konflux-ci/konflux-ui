import React from 'react';
import {
  Alert,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';

export type SnapshotCreationStatusType = {
  message?: string;
  status?: string;
};

type Props = {
  pipelineRun?: PipelineRunKind;
};

export const SnapshotCreationStatus: React.FC<Props> = ({ pipelineRun }) => {
  const snapshotStatusAnnotation =
    pipelineRun?.metadata?.annotations?.[PipelineRunLabel.CREATE_SNAPSHOT_STATUS];

  const snapshotCreationStatus = React.useMemo<SnapshotCreationStatusType | null>(() => {
    try {
      return JSON.parse(snapshotStatusAnnotation ?? '');
    } catch (e) {
      return null;
    }
  }, [snapshotStatusAnnotation]);

  if (!snapshotCreationStatus?.message) return null;

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Snapshot creation status</DescriptionListTerm>
      <DescriptionListDescription>
        {snapshotCreationStatus.status === 'failed' ? (
          <Alert variant="danger" isInline title={snapshotCreationStatus.message} />
        ) : (
          snapshotCreationStatus.message
        )}
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default SnapshotCreationStatus;
