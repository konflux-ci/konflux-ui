import * as React from 'react';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';
import { calculateDuration } from '~/utils/pipeline-utils';

type DurationProps = {
  startTime?: string | number;
  endTime?: string | number;
};

const Duration: React.FC<DurationProps> = ({ startTime, endTime }) => {
  const currentTime = useCurrentTime(endTime == null);

  if (startTime == null) {
    return <>{'-'}</>;
  }

  return <>{calculateDuration(startTime, endTime ?? currentTime)}</>;
};

export default Duration;
