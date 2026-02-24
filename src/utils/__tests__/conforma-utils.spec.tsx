import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ENTERPRISE_CONTRACT_LABEL } from '~/consts/security';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { K8sResourceCommon } from '~/types/k8s';
import { isResourceEnterpriseContract, getRuleStatus } from '../conforma-utils';

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

  describe('getRuleStatus', () => {
    it('should return success icon and text for successes status', () => {
      const result = render(<>{getRuleStatus(CONFORMA_RESULT_STATUS.successes)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Success');
    });

    it('should return violations icon and text for violations status', () => {
      const result = render(<>{getRuleStatus(CONFORMA_RESULT_STATUS.violations)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Failed');
    });

    it('should return warnings icon and text for warnings status', () => {
      const result = render(<>{getRuleStatus(CONFORMA_RESULT_STATUS.warnings)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Warning');
    });

    it('should return missing icon and text for unknown status', () => {
      const result = render(<>{getRuleStatus('unknown' as CONFORMA_RESULT_STATUS)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Missing');
    });
  });

  describe('edge cases', () => {
    it('should handle null status for getRuleStatus', () => {
      const result = render(<>{getRuleStatus(null as unknown as CONFORMA_RESULT_STATUS)}</>);

      expect(result.container).toHaveTextContent('Missing');
    });

    it('should handle undefined status for getRuleStatus', () => {
      const result = render(<>{getRuleStatus(undefined as unknown as CONFORMA_RESULT_STATUS)}</>);

      expect(result.container).toHaveTextContent('Missing');
    });
  });
});
