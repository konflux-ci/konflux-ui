import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { getDuration, isValid, utcDateTimeFormatter } from '~/shared/components/timestamp/datetime';

export type CountdownProps = {
  timestamp: string | number;
  isUnix?: boolean;
  simple?: boolean;
  className?: string;
};

const formatCountdown = (remainingMs: number): string => {
  if (remainingMs <= 0) {
    return 'now';
  }
  const { days, hours, minutes, seconds } = getDuration(remainingMs);

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

export const Countdown: React.FC<React.PropsWithChildren<CountdownProps>> = ({
  timestamp,
  isUnix,
  simple,
  className,
}) => {
  const [now, setNow] = React.useState<number>(() => Date.now());

  const targetDate = React.useMemo(
    () => (isUnix ? new Date((timestamp as number) * 1000) : new Date(timestamp)),
    [isUnix, timestamp],
  );

  const remainingMs = targetDate.getTime() - now;

  React.useEffect(() => {
    if (!isValid(targetDate) || targetDate.getTime() <= Date.now()) {
      return;
    }

    const handle = setInterval(() => {
      const remaining = targetDate.getTime() - Date.now();
      if (remaining <= 0) {
        clearInterval(handle);
        setNow(Date.now());
        return;
      }
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(handle);
  }, [targetDate]);

  if ((typeof timestamp === 'string' && timestamp.length === 0) || !isValid(targetDate)) {
    return <div>-</div>;
  }

  const countdown = formatCountdown(remainingMs);

  if (simple) {
    return <>{countdown}</>;
  }

  return (
    <div className={className}>
      <Tooltip content={<span className="nowrap">{utcDateTimeFormatter.format(targetDate)}</span>}>
        <span data-test="countdown">{countdown}</span>
      </Tooltip>
    </div>
  );
};

Countdown.displayName = 'Countdown';
