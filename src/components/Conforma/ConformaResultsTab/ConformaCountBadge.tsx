import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';

type ConformaCountBadgeProps = {
  count: number;
  type: 'violations' | 'warnings' | 'successes';
};

const badgeConfig = {
  violations: { icon: <ExclamationCircleIcon />, color: 'red' as const },
  warnings: { icon: <ExclamationTriangleIcon />, color: 'gold' as const },
  successes: { icon: <CheckCircleIcon />, color: 'green' as const },
};

export const ConformaCountBadge: React.FC<ConformaCountBadgeProps> = ({ count, type }) => {
  if (count === 0) {
    return <span>0</span>;
  }

  const { icon, color } = badgeConfig[type];

  return (
    <Label
      variant="outline"
      color={color}
      icon={icon}
      isCompact
      data-test={`conforma-count-badge-${type}`}
    >
      {count}
    </Label>
  );
};
