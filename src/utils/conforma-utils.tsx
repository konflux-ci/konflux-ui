import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { DotCircleIcon } from '@patternfly/react-icons/dist/esm/icons/dot-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { t_global_icon_color_status_danger_default as redColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';
import { t_global_icon_color_status_warning_default as yellowColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_warning_default';
import { ENTERPRISE_CONTRACT_LABEL } from '~/consts/security';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { K8sResourceCommon } from '~/types/k8s';

export const isResourceEnterpriseContract = (resource: K8sResourceCommon): boolean => {
  return resource?.metadata?.labels?.[ENTERPRISE_CONTRACT_LABEL] === 'enterprise-contract';
};

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
