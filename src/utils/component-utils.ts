import * as React from 'react';
import { K8sQueryPatchResource } from '../k8s';
import { ComponentModel } from '../models';
import { ComponentKind } from '../types';

// Indicates whether the component was built from a sample and therefore does not support PAC without first forking.
// values: 'true' | 'false'
export const SAMPLE_ANNOTATION = 'appstudio.openshift.io/sample';

// Use with `BuildRequest` to request PaC state changes
// this annotaion gets removed after the request is processed
export const BUILD_REQUEST_ANNOTATION = 'build.appstudio.openshift.io/request';

export const BUILD_STATUS_ANNOTATION = 'build.appstudio.openshift.io/status';

export const GIT_PROVIDER_ANNOTATION = 'git-provider';
export const GIT_PROVIDER_ANNOTATION_VALUE = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  OTHERS: 'others',
};
export const GITLAB_PROVIDER_URL_ANNOTATION = 'git-provider-url';

export enum ComponentBuildState {
  enabled = 'enabled',
  disabled = 'disabled',
  error = 'error',
}

export type ComponentBuildStatus = {
  simple?: {
    'build-start-time'?: string;
    'error-id'?: number;
    'error-message'?: string;
  };
  pac?: {
    state?: ComponentBuildState;
    'merge-url'?: string;
    'error-id'?: number;
    'error-message'?: string;
    /** datetime in RFC 1123 format */
    'configuration-time'?: string;
  };
  message?: string;
};

/**
 *
 * @param component
 * @returns name of latest container image
 *
 * The latest container image fieled is likely changed from time to time.
 * So it is valueable to track it as utils to avoid bringing multiple changes
 * accross several files for furture possible changes.
 *
 */
export const getLastestImage = (component: ComponentKind) =>
  component.status?.lastPromotedImage || component.spec?.containerImage;

/**
 * If whole pac section is missing, PaC state is considered disabled
 * Missing pac section shows that PaC was never requested on this component before,
 * where as pac.state=disabled means that it was provisioned and then removed.
 *
 * https://github.com/redhat-appstudio/build-service/pull/164
 */
export const getComponentBuildStatus = (component: ComponentKind) => {
  const buildStatusJSON = component.metadata?.annotations?.[BUILD_STATUS_ANNOTATION];
  if (!buildStatusJSON) {
    return null;
  }
  try {
    const buildStatus = JSON.parse(buildStatusJSON) as ComponentBuildStatus;
    return buildStatus;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error while parsing component build status: ', e);
    return null;
  }
};

export const getPACProvision = (component: ComponentKind) =>
  getComponentBuildStatus(component)?.pac?.state;

export const isPACEnabled = (component: ComponentKind) =>
  getPACProvision(component) === ComponentBuildState.enabled;

export enum BuildRequest {
  /**
   * submits a new pac build pipeline. The build could be requested at any time regardless PaC Component configuration
   */
  triggerPACBuild = 'trigger-pac-build',
  /**
   * requests Pipelines-as-Code provision for the Component
   */
  configurePac = 'configure-pac',
  /**
   * requests Pipelines-as-Code clean up for the Component
   */
  unconfigurePac = 'unconfigure-pac',
}

export const enablePAC = (component: ComponentKind) =>
  K8sQueryPatchResource({
    model: ComponentModel,
    queryOptions: {
      name: component.metadata.name,
      ns: component.metadata.namespace,
    },
    patches: [
      {
        op: 'add',
        path: `/metadata/annotations/${BUILD_REQUEST_ANNOTATION.replace('/', '~1')}`,
        value: BuildRequest.configurePac,
      },
    ],
  });

export const disablePAC = (component: ComponentKind) =>
  K8sQueryPatchResource({
    model: ComponentModel,
    queryOptions: {
      name: component.metadata.name,
      ns: component.metadata.namespace,
    },
    patches: [
      {
        op: 'add',
        path: `/metadata/annotations/${BUILD_REQUEST_ANNOTATION.replace('/', '~1')}`,
        value: BuildRequest.unconfigurePac,
      },
    ],
  });

export const startNewBuild = (component: ComponentKind) =>
  K8sQueryPatchResource({
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

export const useComponentBuildStatus = (component: ComponentKind): ComponentBuildStatus =>
  React.useMemo(() => getComponentBuildStatus(component), [component]);
