import { mockReleaseWithAllProcessing } from '~/components/Releases/__data__/mock-release-data';
import {
  generateNewReleaseName,
  getManagedProcessingFromRelease,
  getTenantProcessingFromRelease,
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
    it('should return managedProcessing', () => {
      expect(getManagedProcessingFromRelease(mockReleaseWithAllProcessing)).toEqual(
        mockReleaseWithAllProcessing.status?.managedProcessing,
      );
    });
    it('should return tenantProcessing', () => {
      expect(getTenantProcessingFromRelease(mockReleaseWithAllProcessing)).toEqual(
        mockReleaseWithAllProcessing.status?.tenantProcessing,
      );
    });
    it('should return finalProcessing', () => {
      expect(getFinalFromRelease(mockReleaseWithAllProcessing)).toEqual(
        mockReleaseWithAllProcessing.status?.finalProcessing,
      );
    });
  });
});
