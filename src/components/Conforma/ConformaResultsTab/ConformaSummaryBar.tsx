import * as React from 'react';
import { Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { UsersIcon } from '@patternfly/react-icons/dist/esm/icons/users-icon';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';

type ConformaSummaryBarProps = {
  totalComponents: number;
  totalFailed: number;
  totalViolations: number;
  totalWarnings: number;
  totalSuccesses: number;
};

type SummaryItemDef = {
  icon: React.ReactNode;
  count: number;
  label: string;
  tooltip: string;
};

const SummaryItem: React.FC<SummaryItemDef> = ({ icon, count, label, tooltip }) => (
  <Tooltip content={tooltip}>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      <FlexItem>
        <strong>{count}</strong> {label}
      </FlexItem>
    </Flex>
  </Tooltip>
);

export const ConformaSummaryBar: React.FC<ConformaSummaryBarProps> = ({
  totalComponents,
  totalFailed,
  totalViolations,
  totalWarnings,
  totalSuccesses,
}) => {
  const items: SummaryItemDef[] = [
    {
      icon: <UsersIcon />,
      count: totalComponents,
      label: 'Components',
      tooltip: 'Total number of components evaluated by Conforma policies',
    },
    {
      icon: <ExclamationCircleIcon color={dangerColor.value} />,
      count: totalFailed,
      label: 'Failed Components',
      tooltip: 'Components with at least one policy violation',
    },
    {
      icon: <ExclamationCircleIcon color={dangerColor.value} />,
      count: totalViolations,
      label: 'Violations',
      tooltip: 'Total individual policy rule violations across all components',
    },
    {
      icon: <ExclamationTriangleIcon color={warningColor.value} />,
      count: totalWarnings,
      label: 'Warnings',
      tooltip: 'Total individual policy rule warnings across all components',
    },
    {
      icon: <CheckCircleIcon color={successColor.value} />,
      count: totalSuccesses,
      label: 'Successes',
      tooltip: 'Total individual policy rules that passed across all components',
    },
  ];

  return (
    <Flex
      spaceItems={{ default: 'spaceItemsLg' }}
      alignItems={{ default: 'alignItemsCenter' }}
      flexWrap={{ default: 'wrap' }}
      data-test="conforma-summary-bar"
    >
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <Divider orientation={{ default: 'vertical' }} />}
          <FlexItem>
            <SummaryItem {...item} />
          </FlexItem>
        </React.Fragment>
      ))}
    </Flex>
  );
};
