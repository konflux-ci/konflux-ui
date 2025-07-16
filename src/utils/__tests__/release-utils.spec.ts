import { ReleaseKind } from '~/types';
import {
  generateNewReleaseName,
  getManagedProcessingFromRelease,
  getTenantProcessingFromRelease,
  getTenantCollectorProcessingFromRelease,
  getFinalFromRelease,
} from '../release-utils';

const mockedCurrentName = 'local-release-2965kp';
const mockedCurrentNameWithRerun = 'local-release-2965kp-rerun-x52gs';

describe('release utils', () => {
  describe('generateNewReleaseName', () => {
    it("generate new release name successfully - name without 'rerun'", () => {
      const newName = generateNewReleaseName(mockedCurrentName);
      expect(newName).toMatch(/^local-release-2965kp-rerun-/);
    });

    it("generate new release name successfully - name with 'rerun'", () => {
      const newName = generateNewReleaseName(mockedCurrentNameWithRerun);
      expect(newName).toMatch(/^local-release-2965kp-rerun-/);
    });

    it('handles empty string gracefully', () => {
      const newName = generateNewReleaseName('');
      expect(newName).toMatch(/^release-rerun-/);
    });
  });

  describe('get release status helpers', () => {
    const mockRelease: ReleaseKind = {
      status: {
        managedProcessing: { step: 'completed' },
        tenantProcessing: { step: 'running' },
        collectorsProcessing: {
          tenantCollectorsProcessing: { step: 'queued' },
        },
        finalProcessing: { step: 'done' },
      },
    };

    const emptyRelease: ReleaseKind = {
      status: undefined,
    };

    it('should return managedProcessing', () => {
      expect(getManagedProcessingFromRelease(mockRelease)).toEqual({ step: 'completed' });
    });

    it('should return tenantProcessing', () => {
      expect(getTenantProcessingFromRelease(mockRelease)).toEqual({ step: 'running' });
    });

    it('should return tenantCollectorsProcessing', () => {
      expect(getTenantCollectorProcessingFromRelease(mockRelease)).toEqual({ step: 'queued' });
    });

    it('should return finalProcessing', () => {
      expect(getFinalFromRelease(mockRelease)).toEqual({ step: 'done' });
    });

    it('should handle missing status fields gracefully', () => {
      expect(getManagedProcessingFromRelease(emptyRelease)).toBeUndefined();
      expect(getTenantProcessingFromRelease(emptyRelease)).toBeUndefined();
      expect(getTenantCollectorProcessingFromRelease(emptyRelease)).toBeUndefined();
      expect(getFinalFromRelease(emptyRelease)).toBeUndefined();
    });
  });
});
