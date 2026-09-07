import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { getDuration, isValid, utcDateTimeFormatter } from '~/shared/components/timestamp/datetime';
import { useCurrentTime } from '~/shared/hooks/useCurrentTime';

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

export const Countdown: React.FC<CountdownProps> = ({ timestamp, isUnix, simple, className }) => {
  const targetDate = React.useMemo(
    () => (isUnix ? new Date(Number(timestamp) * 1000) : new Date(timestamp)),
    [isUnix, timestamp],
  );

  const isValidTarget = isValid(targetDate);
  const now = useCurrentTime(isValidTarget && targetDate.getTime() > Date.now());
  const remainingMs = targetDate.getTime() - now;

  if ((typeof timestamp === 'string' && timestamp.length === 0) || !isValidTarget) {
    return '-';
  }

  const countdown = formatCountdown(remainingMs);

  if (simple) {
    return countdown;
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
