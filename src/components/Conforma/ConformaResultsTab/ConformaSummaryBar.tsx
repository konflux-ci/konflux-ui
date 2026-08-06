import * as React from 'react';
import { Flex } from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as successColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_status_warning_default as warningColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
import { t_global_icon_color_subtle as subtleColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_subtle';
import {
  ConformaSummaryBarSection,
  type ConformaSummaryBarSectionProps,
} from './ConformaSummaryBarSection';

type ConformaSummaryBarProps = {
  totalComponents: number;
  totalFailed: number;
  totalViolations: number;
  totalWarnings: number;
  totalSuccesses: number;
  totalViolationsRaw?: number;
  totalWarningsRaw?: number;
  totalSuccessesRaw?: number;
};

export const ConformaSummaryBar: React.FC<ConformaSummaryBarProps> = ({
  totalComponents,
  totalFailed,
  totalViolations,
  totalWarnings,
  totalSuccesses,
  totalWarningsRaw,
  totalSuccessesRaw,
  totalViolationsRaw,
}) => {
  const sections: ConformaSummaryBarSectionProps[] = [
    {
      title: 'Components',
      'data-test': 'conforma-summary-components',
      items: [
        {
          icon: <CubesIcon color={subtleColor.value} />,
          count: totalComponents,
          label: 'total',
          tooltip: 'Total number of components scanned',
        },
        {
          icon: <ExclamationCircleIcon color={dangerColor.value} />,
          count: totalFailed,
          label: 'failed',
          tooltip: 'Components with at least one violation',
        },
      ],
    },
    {
      title: 'Upcoming changes',
      'data-test': 'conforma-summary-upcoming-changes',
      items: [
        {
          icon: <ExclamationTriangleIcon color={warningColor.value} />,
          count: totalWarnings,
          label: 'Pending',
          tooltip: 'Policies that will become active soon',
        },
      ],
    },
    {
      title: 'Results summary',
      'data-test': 'conforma-summary-results',
      items: [
        {
          icon: <ExclamationCircleIcon color={dangerColor.value} />,
          count: totalViolations,
          rawCount: totalViolationsRaw,
          label: 'violations',
          tooltip: 'Rules that failed validation',
        },
        {
          icon: <ExclamationTriangleIcon color={warningColor.value} />,
          count: totalWarnings,
          rawCount: totalWarningsRaw,
          label: 'warnings',
          tooltip: 'Rules with upcoming policy changes',
        },
        {
          icon: <CheckCircleIcon color={successColor.value} />,
          count: totalSuccesses,
          rawCount: totalSuccessesRaw,
          label: 'success',
          tooltip: 'Rules that passed validation',
        },
      ],
    },
  ];

  return (
    <Flex
      spaceItems={{ default: 'spaceItemsLg' }}
      alignItems={{ default: 'alignItemsStretch' }}
      flexWrap={{ default: 'wrap' }}
      data-test="conforma-summary-bar"
    >
      {sections.map((section) => (
        <ConformaSummaryBarSection key={section['data-test']} {...section} />
      ))}
    </Flex>
  );
};
