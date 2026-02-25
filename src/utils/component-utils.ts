import * as React from 'react';
import { K8sQueryPatchResource } from '../k8s';
import { ComponentModel, ImageRepositoryModel } from '../models';
import { ComponentKind, ImageRepositoryKind, ImageRepositoryVisibility } from '../types';

// Image registry constants
export const QUAY_IO_HOST = 'quay.io';

// Indicates whether the component was built from a sample and therefore does not support PAC without first forking.
// values: 'true' | 'false'
export const SAMPLE_ANNOTATION = 'appstudio.openshift.io/sample';

// Use with `BuildRequest` to request PaC state changes
// this annotaion gets removed after the request is processed
export const BUILD_REQUEST_ANNOTATION = 'build.appstudio.openshift.io/request';

export const BUILD_STATUS_ANNOTATION = 'build.appstudio.openshift.io/status';

export const LAST_CONFIGURATION_ANNOTATION = 'kubectl.kubernetes.io/last-applied-configuration';

export const GIT_PROVIDER_ANNOTATION = 'git-provider';
export const GIT_PROVIDER_ANNOTATION_VALUE = {
  GITHUB: 'github',
  GITLAB: 'gitlab',
  FORGEJO: 'forgejo',
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
  /**
   * requests Pipelines-as-Code provision for the Component migration
   */
  migratePac = 'configure-pac-no-mr',
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

export const getConfigurationTime = (component: ComponentKind): string => {
  const buildStatus = getComponentBuildStatus(component);
  try {
    const lastConfiguration: ComponentKind | undefined = component.metadata?.annotations?.[
      LAST_CONFIGURATION_ANNOTATION
    ]
      ? JSON.parse(component.metadata?.annotations?.[LAST_CONFIGURATION_ANNOTATION])
      : undefined;

    const lastPACStateIsMigration =
      lastConfiguration?.metadata?.annotations?.[BUILD_REQUEST_ANNOTATION] ===
      BuildRequest.migratePac;

    const lastPACConfiguration = lastConfiguration?.metadata?.annotations?.[BUILD_STATUS_ANNOTATION]
      ? JSON.parse(lastConfiguration.metadata.annotations[BUILD_STATUS_ANNOTATION])
      : undefined;

    return lastPACStateIsMigration && lastPACConfiguration
      ? lastPACConfiguration.pac?.['configuration-time']
      : buildStatus?.pac?.['configuration-time'];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('Error parsing last-applied-configuration annotation:', e);
    return buildStatus?.pac?.['configuration-time'];
  }
};

export const useConfigurationTime = (component: ComponentKind) =>
  React.useMemo(() => getConfigurationTime(component), [component]);

/**
 * Update ImageRepository visibility (public/private)
 * @param imageRepository - The ImageRepository resource to update
 * @param isPrivate - Whether the image should be private
 * @returns Updated ImageRepository resource
 *
 * Note: Automatically detects whether to use 'add' or 'replace' based on
 * whether spec.image.visibility already exists to handle both new and existing fields
 */
export const updateImageRepositoryVisibility = async (
  imageRepository: ImageRepositoryKind,
  isPrivate: boolean,
): Promise<ImageRepositoryKind> => {
  const newVisibility = isPrivate
    ? ImageRepositoryVisibility.private
    : ImageRepositoryVisibility.public;

  // Check if visibility field already exists
  const visibilityExists = imageRepository?.spec?.image?.visibility !== undefined;

  return K8sQueryPatchResource<ImageRepositoryKind>({
    model: ImageRepositoryModel,
    queryOptions: {
      name: imageRepository.metadata.name,
      ns: imageRepository.metadata.namespace,
    },
    patches: [
      {
        op: visibilityExists ? 'replace' : 'add',
        path: '/spec/image/visibility',
        value: newVisibility,
      },
    ],
  });
};

/**
 * Converts a quay.io image URL to use the image proxy host
 * @param imageUrl - The original image URL (e.g., "quay.io/namespace/repo@sha256:...")
 * @param proxyHost - The proxy host to use
 * @returns The proxied image URL (e.g., "image-proxy.example.com/namespace/repo@sha256:...")
 */
const convertToProxyImageUrl = (imageUrl: string, proxyHost: string): string => {
  return imageUrl.replace(QUAY_IO_HOST, proxyHost);
};

/**
 * Determines if an image URL should use the proxy based on repository visibility and repo path
 * @param imageUrl - The image URL to check
 * @param visibility - The ImageRepository visibility setting (null if unknown)
 * @param proxyHost - The proxy host to use for private images (if null, returns original URL)
 * @returns The appropriate URL (proxied for private with valid proxyHost, original otherwise), or null if not provided
 */
export const KONFLUX_IMAGE_PREFIXES = [
  'quay.io/redhat-user-workloads/',
  'quay.io/redhat-user-workloads-stage/',
];
export const getImageUrlForVisibility = (
  imageUrl: string | null,
  visibility: ImageRepositoryVisibility | null,
  proxyHost: string | null,
): string | null => {
  // Return null for empty or null imageUrl
  if (!imageUrl) {
    return null;
  }

  const isKonfluxHandledRepo = KONFLUX_IMAGE_PREFIXES.some((prefix) => imageUrl.startsWith(prefix));

  // Use proxy URL for konflux-owned private repositories only if proxyHost is available
  if (visibility === ImageRepositoryVisibility.private && proxyHost && isKonfluxHandledRepo) {
    return convertToProxyImageUrl(imageUrl, proxyHost);
  }

  // Use original URL for public, user-owned, null visibility, or when proxyHost is not available
  return imageUrl;
};
