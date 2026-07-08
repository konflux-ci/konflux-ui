import * as React from 'react';
import { Divider, Flex, FlexItem, Text, TextVariants, Tooltip } from '@patternfly/react-core';
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
  /**
   * Raw (non-collapsed) counts. When provided and greater than the
   * corresponding collapsed count, a "(N incl. multi-arch)" qualifier is
   * shown so the summary bar never silently under-reports the true number
   * of violations/warnings/successes when arch-duplicates are collapsed.
   */
  totalViolationsRaw?: number;
  totalWarningsRaw?: number;
  totalSuccessesRaw?: number;
};

type SummaryItemDef = {
  icon: React.ReactNode;
  count: number;
  rawCount?: number;
  label: string;
  tooltip: string;
};

const SummaryItem: React.FC<SummaryItemDef> = ({ icon, count, rawCount, label, tooltip }) => (
  <Tooltip content={tooltip}>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      <FlexItem>
        <strong>{count}</strong> {label}
        {rawCount !== undefined && rawCount !== count && (
          <Text
            component={TextVariants.small}
            className="pf-v5-u-ml-xs pf-v5-u-color-400"
          >
            ({rawCount} incl. multi-arch)
          </Text>
        )}
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
  totalViolationsRaw,
  totalWarningsRaw,
  totalSuccessesRaw,
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
      rawCount: totalViolationsRaw,
      label: 'Violations',
      tooltip: 'Total individual policy rule violations across all components',
    },
    {
      icon: <ExclamationTriangleIcon color={warningColor.value} />,
      count: totalWarnings,
      rawCount: totalWarningsRaw,
      label: 'Warnings',
      tooltip: 'Total individual policy rule warnings across all components',
    },
    {
      icon: <CheckCircleIcon color={successColor.value} />,
      count: totalSuccesses,
      rawCount: totalSuccessesRaw,
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
          {i > 0 && (
            <Divider
              orientation={{ default: 'vertical' }}
              data-test="conforma-summary-divider"
            />
          )}
          <FlexItem>
            <SummaryItem {...item} />
          </FlexItem>
        </React.Fragment>
      ))}
    </Flex>
  );
};
