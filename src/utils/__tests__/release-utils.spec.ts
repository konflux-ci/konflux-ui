import { generateNewReleaseName } from '../release-utils';

const mockedCurrentName = 'local-release-2965kp';
const mockedCurrentNameWithRerun = 'local-release-2965kp-rerun-x52gs';

describe('release utils', () => {
  describe('generateNewReleaseName', () => {
    it("generate new release name successfully - name without 'rerun'", () => {
      const newName = generateNewReleaseName(mockedCurrentName);
      expect(newName).toMatch(/^local-release-2965kp-rerun-[a-z0-9]{5}$/);
    });

    it("generate new release name successfully - name with 'rerun'", () => {
      const newName = generateNewReleaseName(mockedCurrentNameWithRerun);
      expect(newName).not.toContain('-rerun-x52gs');
      expect(newName).toMatch(/^local-release-2965kp-rerun-[a-z0-9]{5}$/);
    });

    it('generates unique suffixes', () => {
      const name1 = generateNewReleaseName(mockedCurrentName);
      const name2 = generateNewReleaseName(mockedCurrentName);
      expect(name1).not.toEqual(name2);
    });

    it('handles empty string gracefully', () => {
      const newName = generateNewReleaseName('');
      expect(newName).toMatch(/^release-rerun-[a-z0-9]{5}$/);
    });
  });
});
