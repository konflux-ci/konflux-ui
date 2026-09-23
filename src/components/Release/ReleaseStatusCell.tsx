import React from 'react';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { useReleaseStatus } from '~/hooks/useReleaseStatus';
import { ReleaseKind } from '~/types';

const ReleaseStatusCell: React.FC<{ release: ReleaseKind }> = ({ release }) => {
  const status = useReleaseStatus(release);
  return <StatusIconWithText dataTestAttribute="release-status" status={status} />;
};

export default ReleaseStatusCell;
