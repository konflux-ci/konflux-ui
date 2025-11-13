import '@testing-library/jest-dom';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind, TaskRunKind, TektonResourceLabel } from '~/types';
import { SBOMResultKeys } from '~/utils/pipeline-utils';
import {
  getSourceUrl,
  stripQueryStringParams,
  getSBOMSha,
  getSBOMsFromTaskRuns,
} from '../pipelinerun-utils';

describe('pipelinerun-utils', () => {
  const mockGenerateUrl = jest.fn((sha?: string) =>
    sha ? `https://sbom.example.com/${sha}` : undefined,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockGenerateUrl.mockImplementation((sha?: string) =>
      sha ? `https://sbom.example.com/${sha}` : undefined,
    );
  });

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

  describe('getSBOMSha', () => {
    const mockSha256 = '4bc75035d73f6083683e040fc31f28e0ec6d1cbce5cb0a5e2611eb89bceb6c16';
    const mockSha512 =
      '058c06c944002099dd6254cba4e951c2f7989bbaafd8963fce4e8223199e902c371a2fda326275502992f312197cb8c4a4f9207d3940b59bbd23d76963f12214';

    it('should extract SHA from valid SBOM blob URL with @ separator', () => {
      const result = getSBOMSha(`quay.io/repo@sha256:${mockSha256}`);
      expect(result).toBe(`sha256:${mockSha256}`);
    });

    it('should return null for invalid SBOM blob URL without @ separator', () => {
      const result = getSBOMSha('invalid-url-without-separator');
      expect(result).toBeNull();
    });

    it('should return null for SBOM blob URL with multiple @ separators', () => {
      const result = getSBOMSha(`quay.io@repo@sha256:${mockSha256}`);
      expect(result).toBeNull();
    });

    it('should return null for empty string', () => {
      const result = getSBOMSha('');
      expect(result).toBeNull();
    });

    it('should handle URL with only @ separator and no SHA', () => {
      const result = getSBOMSha('quay.io/repo@');
      expect(result).toBe('');
    });

    it('should extract SHA correctly with different SHA formats', () => {
      expect(getSBOMSha(`registry.example.com/image@sha256:${mockSha256}`)).toBe(
        `sha256:${mockSha256}`,
      );
      expect(getSBOMSha(`quay.io/namespace/repo@sha512:${mockSha512}`)).toBe(
        `sha512:${mockSha512}`,
      );
    });
  });

  describe('getSBOMsFromTaskRuns', () => {
    it('should return empty array for empty task runs', () => {
      const result = getSBOMsFromTaskRuns([], mockGenerateUrl);
      expect(result).toEqual([]);
    });

    it('should filter out task runs without SBOM results', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {},
        },
        status: {
          results: [
            {
              name: 'OTHER_RESULT',
              value: 'some-value',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);
      expect(result).toHaveLength(0);
    });

    it('should filter out task runs with undefined status', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {},
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);
      expect(result).toHaveLength(0);
    });

    it('should identify index SBOM when task label is build-image-index', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {
            [TektonResourceLabel.task]: 'build-image-index',
          },
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:index123',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:index123',
        isIndex: true,
      });
    });

    it('should identify index SBOM when pipelineTask label is build-image-index', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {
            [TektonResourceLabel.pipelineTask]: 'build-image-index',
          },
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:index456',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:index456',
        isIndex: true,
      });
    });

    it('should identify platform-specific SBOM when targetPlatform label exists', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {
            [TektonResourceLabel.targetPlatform]: 'linux/amd64',
          },
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:platform123',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:platform123',
        platform: 'linux/amd64',
        isIndex: false,
      });
    });

    it('should return SBOM without platform when no platform label exists', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {},
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:no-platform123',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:no-platform123',
        isIndex: false,
      });
    });

    it('should handle v1beta1 task runs with taskResults', () => {
      const taskRun: TaskRunKind = {
        apiVersion: 'tekton.dev/v1beta1',
        kind: 'TaskRun',
        metadata: {
          name: 'test-task',
          labels: {
            [TektonResourceLabel.targetPlatform]: 'linux/arm64',
          },
        },
        status: {
          taskResults: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:v1beta1-123',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:v1beta1-123',
        platform: 'linux/arm64',
        isIndex: false,
      });
    });

    it('should handle multiple task runs with mixed types', () => {
      const indexTaskRun: TaskRunKind = {
        metadata: {
          name: 'index-task',
          labels: {
            [TektonResourceLabel.task]: 'build-image-index',
          },
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:index-sha',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const platformTaskRun: TaskRunKind = {
        metadata: {
          name: 'platform-task',
          labels: {
            [TektonResourceLabel.targetPlatform]: 'linux/amd64',
          },
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:platform-sha',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const noPlatformTaskRun: TaskRunKind = {
        metadata: {
          name: 'no-platform-task',
          labels: {},
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:no-platform-sha',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const noSbomTaskRun: TaskRunKind = {
        metadata: {
          name: 'no-sbom-task',
          labels: {},
        },
        status: {
          results: [
            {
              name: 'OTHER_RESULT',
              value: 'some-value',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns(
        [indexTaskRun, platformTaskRun, noPlatformTaskRun, noSbomTaskRun],
        mockGenerateUrl,
      );

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:index-sha',
        isIndex: true,
      });
      expect(result[1]).toEqual({
        url: 'https://sbom.example.com/sha256:platform-sha',
        platform: 'linux/amd64',
        isIndex: false,
      });
      expect(result[2]).toEqual({
        url: 'https://sbom.example.com/sha256:no-platform-sha',
        isIndex: false,
      });
    });

    it('should handle generateUrl returning undefined', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {},
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:test123',
            },
          ],
        },
      } as unknown as TaskRunKind;

      mockGenerateUrl.mockReturnValue(undefined);

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(0);
    });

    it('should prioritize index over platform when both labels exist', () => {
      const taskRun: TaskRunKind = {
        metadata: {
          name: 'test-task',
          labels: {
            [TektonResourceLabel.task]: 'build-image-index',
            [TektonResourceLabel.targetPlatform]: 'linux/amd64',
          },
        },
        status: {
          results: [
            {
              name: SBOMResultKeys.SBOM_SHA,
              value: 'quay.io/repo@sha256:test123',
            },
          ],
        },
      } as unknown as TaskRunKind;

      const result = getSBOMsFromTaskRuns([taskRun], mockGenerateUrl);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        url: 'https://sbom.example.com/sha256:test123',
        isIndex: true,
      });
    });
  });
});
