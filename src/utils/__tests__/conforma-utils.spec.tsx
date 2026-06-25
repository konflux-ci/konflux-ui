import '@testing-library/jest-dom';
import { ENTERPRISE_CONTRACT_LABEL } from '~/consts/security';
import { K8sResourceCommon } from '~/types/k8s';
import { isResourceEnterpriseContract } from '../conforma-utils';

describe('conforma-utils', () => {
  const mockBaseResource: K8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
    },
  };

  describe('isResourceEnterpriseContract', () => {
    it('should return true when resource has enterprise-contract label', () => {
      const resource: K8sResourceCommon = {
        ...mockBaseResource,
        metadata: {
          ...mockBaseResource.metadata,
          labels: {
            [ENTERPRISE_CONTRACT_LABEL]: 'enterprise-contract',
          },
        },
      };

      expect(isResourceEnterpriseContract(resource)).toBe(true);
    });

    it('should return false when resource does not have enterprise-contract label', () => {
      const resource: K8sResourceCommon = {
        ...mockBaseResource,
        metadata: {
          ...mockBaseResource.metadata,
          labels: {
            [ENTERPRISE_CONTRACT_LABEL]: 'build',
          },
        },
      };

      expect(isResourceEnterpriseContract(resource)).toBe(false);
    });

    it('should return false when resource has no labels', () => {
      expect(isResourceEnterpriseContract(mockBaseResource)).toBe(false);
    });

    it('should return false when resource has no metadata', () => {
      const resource: K8sResourceCommon = {
        apiVersion: 'v1',
        kind: 'TaskRun',
      };

      expect(isResourceEnterpriseContract(resource)).toBe(false);
    });

    it('should return false when resource metadata is null', () => {
      const resource: K8sResourceCommon = {
        ...mockBaseResource,
        metadata: null,
      };

      expect(isResourceEnterpriseContract(resource)).toBe(false);
    });

    it('should return false when label value is different', () => {
      const resource: K8sResourceCommon = {
        ...mockBaseResource,
        metadata: {
          ...mockBaseResource.metadata,
          labels: {
            [ENTERPRISE_CONTRACT_LABEL]: 'other-value',
          },
        },
      };

      expect(isResourceEnterpriseContract(resource)).toBe(false);
    });

    it('should return false when label is undefined', () => {
      const resource: K8sResourceCommon = {
        ...mockBaseResource,
        metadata: {
          ...mockBaseResource.metadata,
          labels: {
            [ENTERPRISE_CONTRACT_LABEL]: undefined,
          },
        },
      };

      expect(isResourceEnterpriseContract(resource)).toBe(false);
    });
  });
});
