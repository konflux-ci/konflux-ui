import '@testing-library/jest-dom';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { getSourceUrl, stripQueryStringParams } from '../pipelinerun-utils';

describe('pipelinerun-utils', () => {
  describe('stripQueryStringParams', () => {
    it('should remove query string parameters from URL', () => {
      const url = 'https://github.com/user/repo?foo=bar&baz=qux';
      const result = stripQueryStringParams(url);
      expect(result).toBe('https://github.com/user/repo');
    });

    it('should return URL without query string if none exists', () => {
      const url = 'https://github.com/user/repo';
      const result = stripQueryStringParams(url);
      expect(result).toBe('https://github.com/user/repo');
    });

    it('should handle URLs with hash fragments', () => {
      const url = 'https://github.com/user/repo/tree/main?tab=readme#section';
      const result = stripQueryStringParams(url);
      expect(result).toBe('https://github.com/user/repo/tree/main');
    });

    it('should return undefined for empty or null URL', () => {
      expect(stripQueryStringParams('')).toBeUndefined();
      expect(stripQueryStringParams(null)).toBeUndefined();
      expect(stripQueryStringParams(undefined)).toBeUndefined();
    });

    it('should preserve path segments', () => {
      const url = 'https://gitlab.com/group/subgroup/project/tree/branch?ref=main';
      const result = stripQueryStringParams(url);
      expect(result).toBe('https://gitlab.com/group/subgroup/project/tree/branch');
    });
  });

  describe('getSourceUrl', () => {
    it('should return URL from PAC annotation when available', () => {
      const pipelineRun = {
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]:
              'https://github.com/user/repo?param=value',
          },
        },
      } as unknown as PipelineRunKind;

      const result = getSourceUrl(pipelineRun);
      expect(result).toBe('https://github.com/user/repo');
    });

    it('should return URL from BuildService annotation when PAC annotation is not available', () => {
      const pipelineRun = {
        metadata: {
          annotations: {
            [PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION]:
              'https://gitlab.com/user/repo?param=value',
          },
        },
      } as unknown as PipelineRunKind;

      const result = getSourceUrl(pipelineRun);
      expect(result).toBe('https://gitlab.com/user/repo');
    });

    it('should prefer PAC annotation over BuildService annotation', () => {
      const pipelineRun = {
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]: 'https://github.com/pac/repo',
            [PipelineRunLabel.BUILD_SERVICE_REPO_ANNOTATION]: 'https://gitlab.com/build/repo',
          },
        },
      } as unknown as PipelineRunKind;

      const result = getSourceUrl(pipelineRun);
      expect(result).toBe('https://github.com/pac/repo');
    });

    it('should return undefined when no annotations are present', () => {
      const pipelineRun = {
        metadata: {
          annotations: {},
        },
      } as PipelineRunKind;

      const result = getSourceUrl(pipelineRun);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null or undefined pipelineRun', () => {
      expect(getSourceUrl(null)).toBeUndefined();
      expect(getSourceUrl(undefined)).toBeUndefined();
    });

    it('should return undefined when metadata is missing', () => {
      const pipelineRun = {} as PipelineRunKind;
      const result = getSourceUrl(pipelineRun);
      expect(result).toBeUndefined();
    });

    it('should strip query parameters from the returned URL', () => {
      const pipelineRun = {
        metadata: {
          annotations: {
            [PipelineRunLabel.COMMIT_FULL_REPO_URL_ANNOTATION]:
              'https://github.com/user/repo?foo=bar&baz=qux',
          },
        },
      } as unknown as PipelineRunKind;

      const result = getSourceUrl(pipelineRun);
      expect(result).toBe('https://github.com/user/repo');
    });
  });
});
