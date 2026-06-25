import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { RULE_STATUS_CONFIG } from '~/components/Conforma/utils';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';

type ConformaCountBadgeProps = {
  count: number;
  type: CONFORMA_RESULT_STATUS;
};

export const ConformaCountBadge: React.FC<ConformaCountBadgeProps> = ({ count, type }) => {
  if (count === 0) {
    return <span>0</span>;
  }

  const { Icon, labelColor } = RULE_STATUS_CONFIG[type];

  return (
    <Label
      variant="outline"
      color={labelColor}
      icon={<Icon />}
      isCompact
      data-test={`conforma-count-badge-${type}`}
    >
      {count}
    </Label>
  );
};
