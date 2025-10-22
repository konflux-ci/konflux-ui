import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ENTERPRISE_CONTRACT_STATUS,
  EnterpriseContractResult,
  EnterpriseContractRule,
} from '../../types';
import { K8sResourceCommon } from '../../types/k8s';
import {
  isResourceEnterpriseContract,
  getRuleStatus,
  extractEcResultsFromTaskRunLogs,
  ENTERPRISE_CONTRACT_LABEL,
} from '../enterprise-contract-utils';

describe('enterprise-contract-utils', () => {
  const mockBaseResource: K8sResourceCommon = {
    apiVersion: 'v1',
    kind: 'TaskRun',
    metadata: {
      name: 'test-taskrun',
    },
  };

  const mockECRule: EnterpriseContractRule = {
    metadata: {
      title: 'Test Rule',
      description: 'Test description',
      collections: ['test'],
      code: 'test.rule',
    },
    msg: 'Test message',
  };

  const mockECComponent = {
    containerImage: 'quay.io/test/image:latest',
    name: 'test-component',
    success: true,
  };

  // Shared EC rule variations
  const mockViolationRule: EnterpriseContractRule = {
    ...mockECRule,
    metadata: {
      ...mockECRule.metadata,
      title: 'CVE Found',
      description: 'Critical CVE detected',
      collections: ['security'],
      code: 'cve.critical',
    },
    msg: 'CVE-2024-1234 found',
  };

  const mockWarningRule: EnterpriseContractRule = {
    ...mockECRule,
    metadata: {
      ...mockECRule.metadata,
      title: 'Deprecated API',
      description: 'Using deprecated API',
      collections: ['deprecation'],
      code: 'api.deprecated',
    },
    msg: 'API version v1beta1 is deprecated',
  };

  const mockSuccessRule: EnterpriseContractRule = {
    ...mockECRule,
    metadata: {
      ...mockECRule.metadata,
      title: 'Image Signature Valid',
      description: 'Image is properly signed',
      collections: ['signing'],
      code: 'signature.valid',
    },
    msg: 'Signature verification passed',
  };

  // Helper to create simple EC data
  const createSimpleECResult = (
    components: EnterpriseContractResult['components'],
  ): EnterpriseContractResult => ({
    components,
  });

  // Helper to create EC logs
  const createECLog = (data: EnterpriseContractResult): string =>
    `[report-json] ${JSON.stringify(data)}`;

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
      const result = render(<>{getRuleStatus(ENTERPRISE_CONTRACT_STATUS.successes)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Success');
    });

    it('should return violations icon and text for violations status', () => {
      const result = render(<>{getRuleStatus(ENTERPRISE_CONTRACT_STATUS.violations)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Failed');
    });

    it('should return warnings icon and text for warnings status', () => {
      const result = render(<>{getRuleStatus(ENTERPRISE_CONTRACT_STATUS.warnings)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Warning');
    });

    it('should return missing icon and text for unknown status', () => {
      const result = render(<>{getRuleStatus('unknown' as ENTERPRISE_CONTRACT_STATUS)}</>);

      expect(result.container.querySelector('svg')).toBeInTheDocument();
      expect(result.container).toHaveTextContent('Missing');
    });

    it('should render CheckCircleIcon for successes', () => {
      const result = render(<>{getRuleStatus(ENTERPRISE_CONTRACT_STATUS.successes)}</>);
      const svg = result.container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('pf-v5-svg');
    });

    it('should render ExclamationCircleIcon for violations', () => {
      const result = render(<>{getRuleStatus(ENTERPRISE_CONTRACT_STATUS.violations)}</>);
      const svg = result.container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('pf-v5-svg');
    });

    it('should render ExclamationTriangleIcon for warnings', () => {
      const result = render(<>{getRuleStatus(ENTERPRISE_CONTRACT_STATUS.warnings)}</>);
      const svg = result.container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('pf-v5-svg');
    });

    it('should render DotCircleIcon for unknown status', () => {
      const result = render(<>{getRuleStatus('unknown' as ENTERPRISE_CONTRACT_STATUS)}</>);
      const svg = result.container.querySelector('svg');

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('pf-v5-svg');
    });
  });

  describe('extractEcResultsFromTaskRunLogs', () => {
    it('should extract and parse EC results from logs with single line', () => {
      const ecData = createSimpleECResult([
        {
          name: 'test-component',
          success: true,
          containerImage: '',
        },
      ]);
      const logs = createECLog(ecData);

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(ecData);
    });

    it('should extract and parse EC results from logs with multiple lines', () => {
      const expectedData = createSimpleECResult([
        {
          name: 'component1',
          success: true,
          containerImage: 'image1:latest',
        },
        {
          name: 'component2',
          success: false,
          containerImage: 'image2:latest',
        },
      ]);

      const logs = `
        Some other log line
        [report-json] {"components":[
        [report-json] {"name":"component1","success":true,"containerImage":"image1:latest"},
        [report-json] {"name":"component2","success":false,"containerImage":"image2:latest"}
        [report-json] ]}
        Another log line
      `;

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(expectedData);
    });

    it('should handle EC results with nested data', () => {
      const violationRule: EnterpriseContractRule = {
        ...mockECRule,
        metadata: {
          ...mockECRule.metadata,
          title: 'Test Violation',
          code: 'test.violation',
        },
        msg: 'Violation message',
      };

      const ecData = createSimpleECResult([
        {
          ...mockECComponent,
          success: false,
          violations: [violationRule],
          warnings: [],
          successes: [],
        },
      ]);

      const logs = createECLog(ecData);

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(ecData);
      expect(result.components[0].violations).toHaveLength(1);
      expect(result.components[0].violations[0].metadata.title).toBe('Test Violation');
    });

    it('should extract multiline JSON correctly', () => {
      const ecData = createSimpleECResult([
        {
          name: 'component1',
          success: true,
          containerImage: 'image1:v1',
        },
        {
          name: 'component2',
          success: false,
          containerImage: 'image2:v2',
        },
      ]);

      const jsonString = JSON.stringify(ecData);
      const jsonParts = jsonString.match(/.{1,50}/g) || [];
      const logs = jsonParts.map((part) => `[report-json] ${part}`).join('\n');

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(ecData);
    });

    it('should handle logs with mixed content', () => {
      const expectedData = createSimpleECResult([
        {
          name: 'test',
          success: true,
          containerImage: 'test-image:v1',
        },
      ]);

      const logs = `
        [info] Starting task
        [report-json] {"components":
        [debug] Some debug info
        [report-json] [{"name":"test","success":true,"containerImage":"test-image:v1"}]
        [report-json] }
        [info] Task completed
      `;

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(expectedData);
    });

    it('should extract results with violations, warnings, and successes', () => {
      const ecData = createSimpleECResult([
        {
          ...mockECComponent,
          containerImage: 'quay.io/test/image:v1',
          success: false,
          violations: [mockViolationRule],
          warnings: [mockWarningRule],
          successes: [mockSuccessRule],
        },
      ]);

      const logs = createECLog(ecData);

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result.components[0].violations).toHaveLength(1);
      expect(result.components[0].warnings).toHaveLength(1);
      expect(result.components[0].successes).toHaveLength(1);
    });

    it('should handle empty components array', () => {
      const ecData = createSimpleECResult([]);
      const logs = createECLog(ecData);

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(ecData);
    });

    it('should handle component with only required fields', () => {
      const minimalComponent = {
        containerImage: 'img',
        name: 'c',
        success: true,
      };
      const ecData = createSimpleECResult([minimalComponent]);
      const logs = createECLog(ecData);

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result.components[0]).toEqual(minimalComponent);
    });

    it('should properly join split JSON across multiple log lines', () => {
      const expectedData = createSimpleECResult([
        {
          name: 'test',
          success: true,
          containerImage: 'test:v1',
        },
      ]);

      const part1 = '{"compo';
      const part2 = 'nents":[{"name":"test",';
      const part3 = '"success":true,"containerImage":"test:v1"}]}';

      const logs = `
        [report-json] ${part1}
        [report-json] ${part2}
        [report-json] ${part3}
      `;

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(expectedData);
    });

    it('should handle logs with spaces and tabs', () => {
      const ecData = createSimpleECResult([]);
      const logs = `
        \t[info] Starting
        \t[report-json]   ${JSON.stringify(ecData)}
        \t[info] Done
      `;

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(ecData);
    });
  });

  describe('edge cases', () => {
    it('should handle resource with empty labels object', () => {
      const resource: K8sResourceCommon = {
        ...mockBaseResource,
        metadata: {
          ...mockBaseResource.metadata,
          labels: {},
        },
      };

      expect(isResourceEnterpriseContract(resource)).toBe(false);
    });

    it('should handle null status for getRuleStatus', () => {
      const result = render(<>{getRuleStatus(null as unknown as ENTERPRISE_CONTRACT_STATUS)}</>);

      expect(result.container).toHaveTextContent('Missing');
    });

    it('should handle undefined status for getRuleStatus', () => {
      const result = render(
        <>{getRuleStatus(undefined as unknown as ENTERPRISE_CONTRACT_STATUS)}</>,
      );

      expect(result.container).toHaveTextContent('Missing');
    });

    it('should handle complex nested EC results', () => {
      const policyViolation1: EnterpriseContractRule = {
        ...mockECRule,
        metadata: {
          ...mockECRule.metadata,
          title: 'Policy Violation 1',
          description: 'Description 1',
          collections: ['policy', 'security'],
          code: 'pol.sec.001',
          // eslint-disable-next-line camelcase
          effective_on: '2024-01-01',
          solution: 'Update dependencies',
        },
        msg: 'Violation found in dependency',
      };

      const policyViolation2: EnterpriseContractRule = {
        ...mockECRule,
        metadata: {
          ...mockECRule.metadata,
          title: 'Policy Violation 2',
          description: 'Description 2',
          collections: ['compliance'],
          code: 'pol.comp.002',
        },
        msg: 'Compliance check failed',
      };

      const bestPracticeWarning: EnterpriseContractRule = {
        ...mockECRule,
        metadata: {
          ...mockECRule.metadata,
          title: 'Warning 1',
          description: 'Warning description',
          collections: ['best-practices'],
          code: 'warn.bp.001',
        },
        msg: 'Consider updating approach',
      };

      const validationSuccess: EnterpriseContractRule = {
        ...mockECRule,
        metadata: {
          ...mockECRule.metadata,
          title: 'Success 1',
          description: 'Success description',
          collections: ['validation'],
          code: 'succ.val.001',
        },
        msg: 'All validations passed',
      };

      const verificationSuccess: EnterpriseContractRule = {
        ...mockECRule,
        metadata: {
          ...mockECRule.metadata,
          title: 'Success 2',
          description: 'Another success',
          collections: ['verification'],
          code: 'succ.ver.001',
        },
        msg: 'Verification complete',
      };

      const complexData = createSimpleECResult([
        {
          containerImage: 'registry.io/org/app:tag',
          name: 'main-component',
          success: false,
          violations: [policyViolation1, policyViolation2],
          warnings: [bestPracticeWarning],
          successes: [validationSuccess, verificationSuccess],
        },
      ]);

      const logs = createECLog(complexData);

      const result = extractEcResultsFromTaskRunLogs(logs);

      expect(result).toEqual(complexData);
      expect(result.components[0].violations).toHaveLength(2);
      expect(result.components[0].warnings).toHaveLength(1);
      expect(result.components[0].successes).toHaveLength(2);
      expect(result.components[0].violations[0].metadata.effective_on).toBe('2024-01-01');
      expect(result.components[0].violations[0].metadata.solution).toBe('Update dependencies');
    });
  });
});
