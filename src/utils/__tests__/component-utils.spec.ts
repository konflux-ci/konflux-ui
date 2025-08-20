import { renderHook } from '@testing-library/react-hooks';
import { ComponentModel } from '../../models';
import { ComponentKind } from '../../types';
import {
  isPACEnabled,
  useComponentBuildStatus,
  BUILD_STATUS_ANNOTATION,
  startNewBuild,
  BUILD_REQUEST_ANNOTATION,
  BuildRequest,
  getLastestImage,
} from '../component-utils';
import { createK8sUtilMock } from '../test-utils';

const k8sPatchResourceMock = createK8sUtilMock('K8sQueryPatchResource');

describe('component-utils', () => {
  it('should detect pac enabled state', () => {
    const createComponent = (buildState: string | undefined): ComponentKind => {
      const result = {
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: buildState && JSON.stringify({ pac: { state: buildState } }),
          },
        },
      };
      return (result ?? {}) as ComponentKind;
    };
    expect(isPACEnabled(createComponent(undefined))).toBe(false);
    expect(isPACEnabled(createComponent('enabled'))).toBe(true);
    expect(isPACEnabled(createComponent('disabled'))).toBe(false);
  });

  it('should start a new PAC build when PAC is enabled', () => {
    const createComponent = (buildState: string | undefined): ComponentKind => {
      const result = {
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: buildState && JSON.stringify({ pac: { state: buildState } }),
          },
        },
      };
      return (result ?? {}) as ComponentKind;
    };

    const component = createComponent('enabled');
    void startNewBuild(component);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: component.metadata.name,
        ns: component.metadata.namespace,
      },
      patches: [
        {
          op: 'add',
          path: `/metadata/annotations/${BUILD_REQUEST_ANNOTATION.replace('/', '~1')}`,
          value: BuildRequest.triggerPACBuild,
        },
      ],
    });
  });

  it('should start a new simple build when PAC is not enabled', () => {
    const createComponent = (buildState: string | undefined): ComponentKind => {
      const result = {
        metadata: {
          annotations: {
            [BUILD_STATUS_ANNOTATION]: buildState && JSON.stringify({ pac: { state: buildState } }),
          },
        },
      };
      return (result ?? {}) as ComponentKind;
    };

    const component = createComponent('disabled');
    void startNewBuild(component);

    expect(k8sPatchResourceMock).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        name: component.metadata.name,
        ns: component.metadata.namespace,
      },
      patches: [
        {
          op: 'add',
          path: `/metadata/annotations/${BUILD_REQUEST_ANNOTATION.replace('/', '~1')}`,
          value: BuildRequest.triggerPACBuild,
        },
      ],
    });
  });

  it('should provide parsed component build status when available', () => {
    const mockComponent = {
      metadata: {
        annotations: {
          [BUILD_STATUS_ANNOTATION]:
            '{"pac":{"state":"enabled","merge-url":"example.com"},"message":"done"}',
        },
      },
    } as unknown as ComponentKind;

    expect(renderHook(() => useComponentBuildStatus(mockComponent)).result.current).toEqual({
      pac: { state: 'enabled', 'merge-url': 'example.com' },
      message: 'done',
    });
  });

  it('should return status.lastPromotedImage when lastPromotedImage is available', () => {
    const mockComponent = {
      status: {
        lastPromotedImage: 'test-url',
      },
    } as unknown as ComponentKind;

    expect(getLastestImage(mockComponent)).toEqual('test-url');
  });

  it('should return spec.containerImage when lastPromotedImage is unavailable', () => {
    const mockComponent = {
      spec: {
        containerImage: 'test-url',
      },
    } as unknown as ComponentKind;

    expect(getLastestImage(mockComponent)).toEqual('test-url');
  });

  it('should return status.lastPromotedImage when lastPromotedImage and containerImage are both available', () => {
    const mockComponent = {
      spec: {
        containerImage: 'test-url',
      },
      status: {
        lastPromotedImage: 'test-url-promoted',
      },
    } as unknown as ComponentKind;

    expect(getLastestImage(mockComponent)).toEqual('test-url-promoted');
  });
});
