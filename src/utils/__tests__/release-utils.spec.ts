import { generateNewReleaseName } from '../release-utils';

const mockedCurrentName = 'local-release-2965kp';
const mockedCurrentNameWithRerun = 'local-release-2965kp-rerun-x52gs';

describe('release utils', () => {
  describe('generateNewReleaseName', () => {
    it("generate new release name successfully - name without 'rerun'", () => {
      const newName = generateNewReleaseName(mockedCurrentName);
      expect(newName).toMatch(/^local-release-2965kp-rerun-$/);
    });

    it("generate new release name successfully - name with 'rerun'", () => {
      const newName = generateNewReleaseName(mockedCurrentNameWithRerun);
      expect(newName).toMatch(/^local-release-2965kp-rerun-$/);
    });

    it('handles empty string gracefully', () => {
      const newName = generateNewReleaseName('');
      expect(newName).toMatch(/^release-rerun-$/);
    });
  });
});
