import * as React from 'react';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { DotCircleIcon } from '@patternfly/react-icons/dist/esm/icons/dot-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_danger_default as redColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_status_warning_default as yellowColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
import { CONFORMA_RESULT_STATUS, ConformaResult } from '~/types/conforma';

export type RuleStatusConfig = {
  Icon: React.ComponentType<{ color?: string }>;
  iconColor: string;
  labelColor: 'red' | 'yellow' | 'green' | 'grey';
  statusText: string;
};

export const RULE_STATUS_CONFIG: Record<CONFORMA_RESULT_STATUS, RuleStatusConfig> = {
  [CONFORMA_RESULT_STATUS.violations]: {
    Icon: ExclamationCircleIcon,
    iconColor: redColor.value,
    labelColor: 'red',
    statusText: CONFORMA_RESULT_STATUS.violations,
  },
  [CONFORMA_RESULT_STATUS.warnings]: {
    Icon: ExclamationTriangleIcon,
    iconColor: yellowColor.value,
    labelColor: 'yellow',
    statusText: CONFORMA_RESULT_STATUS.warnings,
  },
  [CONFORMA_RESULT_STATUS.successes]: {
    Icon: CheckCircleIcon,
    iconColor: greenColor.value,
    labelColor: 'green',
    statusText: CONFORMA_RESULT_STATUS.successes,
  },
};

export const getRuleStatus = (type: CONFORMA_RESULT_STATUS) => {
  const config = RULE_STATUS_CONFIG[type];
  if (!config) {
    return (
      <>
        <DotCircleIcon /> Missing
      </>
    );
  }
  const { Icon, iconColor, statusText } = config;
  return (
    <>
      <Icon color={iconColor} /> {statusText}
    </>
  );
};

/**
 * This regex expect the logs from tekton results to be in this formay
 *
 * ```
 * step-vulnerabilities :-
 * Lorem Ipsum some logs
 *
 * step-report-json :-
 * {"success":true,"components":[{"name":"devfile-sample-code-with-quarkus-1",<... Conforma report in JSON ...>,}]}
 *
 * ```
 *
 */
const CONFORMA_REPORT_JSON_REGEX = /((?<=step-report-json\s*:-\s*)(\{.*?\})(?=\s*step-|$))/gs;

export const extractConformaResultsFromTaskRunLogs = (logs: string): ConformaResult => {
  const extractedLogs = logs.match(CONFORMA_REPORT_JSON_REGEX);
  if (!extractedLogs || !extractedLogs[0]) {
    throw new Error('No valid Conforma report JSON found in logs');
  }
  return JSON.parse(extractedLogs[0]);
};
