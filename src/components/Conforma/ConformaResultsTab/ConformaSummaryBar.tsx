import * as React from 'react';
import {
  Divider,
  Flex,
  FlexItem,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_color_status_warning_100 as warningColor } from '@patternfly/react-tokens/dist/js/t_global_color_status_warning_100';
import { t_global_icon_color_status_danger_default as dangerColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as successColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_subtle as subtleColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_subtle';

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
}) => {
  return (
    <Flex
      spaceItems={{ default: 'spaceItemsLg' }}
      alignItems={{ default: 'alignItemsStretch' }}
      flexWrap={{ default: 'wrap' }}
      data-test="conforma-summary-bar"
    >
      <FlexItem className="conforma-summary-bar__section" data-test="conforma-summary-components">
        <Content component={ContentVariants.h4} className="pf-v6-u-mb-sm">
          Components
        </Content>
        <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <CubesIcon color={subtleColor.value} className="pf-v6-u-mr-xs" />
            {totalComponents} total
          </FlexItem>
          <Divider orientation={{ default: 'vertical' }} />
          <FlexItem>
            <ExclamationCircleIcon color={dangerColor.value} className="pf-v6-u-mr-xs" />
            {totalFailed} failed
          </FlexItem>
        </Flex>
      </FlexItem>

      <FlexItem
        className="conforma-summary-bar__section"
        data-test="conforma-summary-upcoming-changes"
      >
        <Content component={ContentVariants.h4} className="pf-v6-u-mb-sm">
          Upcoming changes
        </Content>
        <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <ExclamationTriangleIcon color={warningColor.value} className="pf-v6-u-mr-xs" />
            {totalWarnings} Pending
          </FlexItem>
        </Flex>
      </FlexItem>

      <FlexItem className="conforma-summary-bar__section" data-test="conforma-summary-results">
        <Content component={ContentVariants.h4} className="pf-v6-u-mb-sm">
          Results summary
        </Content>
        <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
          <FlexItem>
            <ExclamationCircleIcon color={dangerColor.value} className="pf-v6-u-mr-xs" />
            {totalViolations} violations
          </FlexItem>
          <Divider orientation={{ default: 'vertical' }} />
          <FlexItem>
            <ExclamationTriangleIcon color={warningColor.value} className="pf-v6-u-mr-xs" />
            {totalWarnings} warnings
          </FlexItem>
          <Divider orientation={{ default: 'vertical' }} />
          <FlexItem>
            <CheckCircleIcon color={successColor.value} className="pf-v6-u-mr-xs" />
            {totalSuccesses} success
          </FlexItem>
        </Flex>
      </FlexItem>
    </Flex>
  );
};
