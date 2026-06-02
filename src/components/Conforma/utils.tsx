import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { DotCircleIcon } from '@patternfly/react-icons/dist/esm/icons/dot-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_danger_default as redColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_status_warning_default as yellowColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
import { CONFORMA_RESULT_STATUS, ConformaResult } from '~/types/conforma';

export const getRuleStatus = (type: CONFORMA_RESULT_STATUS) => {
  switch (type) {
    case CONFORMA_RESULT_STATUS.successes:
      return (
        <>
          <CheckCircleIcon color={greenColor.value} /> {CONFORMA_RESULT_STATUS.successes}
        </>
      );
    case CONFORMA_RESULT_STATUS.violations:
      return (
        <>
          <ExclamationCircleIcon color={redColor.value} /> {CONFORMA_RESULT_STATUS.violations}
        </>
      );
    case CONFORMA_RESULT_STATUS.warnings:
      return (
        <>
          <ExclamationTriangleIcon color={yellowColor.value} /> {CONFORMA_RESULT_STATUS.warnings}
        </>
      );
    default:
      return (
        <>
          <DotCircleIcon /> Missing
        </>
      );
  }
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
