import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { DotCircleIcon } from '@patternfly/react-icons/dist/esm/icons/dot-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { global_danger_color_100 as redColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_success_color_100 as greenColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as yellowColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import { ENTERPRISE_CONTRACT_STATUS, EnterpriseContractResult } from '~/types';
import { K8sResourceCommon } from '~/types/k8s';

export const ENTERPRISE_CONTRACT_LABEL = 'build.appstudio.redhat.com/pipeline';

export const isResourceEnterpriseContract = (resource: K8sResourceCommon): boolean => {
  return resource?.metadata?.labels?.[ENTERPRISE_CONTRACT_LABEL] === 'enterprise-contract';
};

export const getRuleStatus = (type: ENTERPRISE_CONTRACT_STATUS) => {
  switch (type) {
    case ENTERPRISE_CONTRACT_STATUS.successes:
      return (
        <>
          <CheckCircleIcon color={greenColor.value} /> {ENTERPRISE_CONTRACT_STATUS.successes}
        </>
      );
    case ENTERPRISE_CONTRACT_STATUS.violations:
      return (
        <>
          <ExclamationCircleIcon color={redColor.value} /> {ENTERPRISE_CONTRACT_STATUS.violations}
        </>
      );
    case ENTERPRISE_CONTRACT_STATUS.warnings:
      return (
        <>
          <ExclamationTriangleIcon color={yellowColor.value} />{' '}
          {ENTERPRISE_CONTRACT_STATUS.warnings}
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

export const extractEcResultsFromTaskRunLogs = (logs: string): EnterpriseContractResult => {
  const extractedLogs = logs.match(/(\[report-json\] ).+/g);

  if (!extractedLogs) {
    throw new Error('No [report-json] lines found');
  }

  try {
    const json = JSON.parse(extractedLogs.map((l) => l.replace('[report-json] ', '')).join(''));
    return json;
  } catch (error) {
    throw new Error(`Failed to parse EC results: ${error.message}`);
  }
};
