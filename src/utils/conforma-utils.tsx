import { ENTERPRISE_CONTRACT_LABEL } from '~/consts/security';
import { K8sResourceCommon } from '~/types/k8s';

export const isResourceEnterpriseContract = (resource: K8sResourceCommon): boolean => {
  return resource?.metadata?.labels?.[ENTERPRISE_CONTRACT_LABEL] === 'enterprise-contract';
};
