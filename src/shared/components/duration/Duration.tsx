import * as React from 'react';
import { calculateDuration } from '~/utils/pipeline-utils';

type DurationProps = {
  startTime?: string | number;
  endTime?: string | number;
};

const Duration: React.FC<React.PropsWithChildren<DurationProps>> = ({ startTime, endTime }) => {
  const [currentTime, setCurrentTime] = React.useState<number>(Date.now());

  React.useEffect(() => {
    if (endTime == null) {
      const handle = setInterval(() => {
        setCurrentTime(Date.now());
      }, 1000);
      return () => clearInterval(handle);
    }
  }, [endTime]);

  if (startTime == null) {
    return <>{'-'}</>;
  }

  return <>{calculateDuration(startTime, endTime ?? currentTime)}</>;
};

export default Duration;
