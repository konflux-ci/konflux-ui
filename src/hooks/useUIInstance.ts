import React from 'react';
import { PLACEHOLDER, REPO_PUSH, SBOM_EVENT_TO_BOMBINO } from '../consts/constants';
import {
  KonfluxInstanceVisibility,
  KonfluxInstanceVisibilityType,
  SBOMEventNotification,
} from '../types/konflux-public-info';
import { useKonfluxPublicInfo } from './useKonfluxPublicInfo';

export enum ConsoleDotEnvironments {
  dev = 'dev',
  stage = 'stage',
  qa = 'qa',
  prod = 'prod',
  // eslint-disable-next-line
  internalProd = 'prod',
  // eslint-disable-next-line
  internalStage = 'stage',
}

export const getEnv = (): ConsoleDotEnvironments => ConsoleDotEnvironments.prod;

const internalInstance = (host: string) => (env: 'prod' | 'stage') =>
  new RegExp(`stone-${env}-([A-Za-z0-9]+).([a-z]+).([a-z0-9]+).openshiftapps.com`, 'g').test(host);

export const getInternalInstance = () => {
  const matchInternalInstance = internalInstance(window.location.hostname);
  if (matchInternalInstance('prod')) {
    return ConsoleDotEnvironments.internalProd;
  } else if (matchInternalInstance('stage')) {
    return ConsoleDotEnvironments.internalStage;
  }
  return undefined;
};

export const useUIInstance = (): ConsoleDotEnvironments => {
  /**
   * [TODO]: get the environment based on the new UI
   */
  const env = getEnv();
  return getInternalInstance() ?? env;
};

const getBombinoUrl = (
  notifications: { title: string; event: string; config?: { url: string } }[],
) => {
  const notification = notifications.find(
    (n) => n.title === SBOM_EVENT_TO_BOMBINO && n.event === REPO_PUSH,
  );
  return notification?.config?.url ?? '';
};

export const useSbomUrl = (): ((imageHash: string, sbomSha?: string) => string | undefined) => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  return React.useCallback(
    (imageHash: string, sbomSha?: string) => {
      if (loaded && !error) {
        const sbomSHAUrl = konfluxPublicInfo.integrations?.sbom_server?.sbom_sha ?? '';
        const sbomServerUrl = konfluxPublicInfo.integrations?.sbom_server?.url ?? '';

        if (sbomSHAUrl && sbomSha) {
          return sbomSHAUrl.replace(PLACEHOLDER, sbomSha);
        }
        // fallback if sbom sha data not available
        return sbomServerUrl.replace(PLACEHOLDER, imageHash);
      }
    },
    [
      error,
      konfluxPublicInfo.integrations?.sbom_server?.sbom_sha,
      konfluxPublicInfo.integrations?.sbom_server?.url,
      loaded,
    ],
  );
};

export const useBombinoUrl = (): string | undefined => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();

  if (loaded && !error && konfluxPublicInfo?.integrations?.image_controller?.notifications) {
    const notifications = konfluxPublicInfo.integrations.image_controller.notifications || [];
    return getBombinoUrl(notifications);
  }
  return undefined;
};

export const useApplicationUrl = (): string | undefined => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  if (loaded && !error && konfluxPublicInfo?.integrations?.github?.application_url) {
    return konfluxPublicInfo.integrations.github.application_url;
  }
  return undefined;
};

export const useNotifications = (): SBOMEventNotification[] => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  if (loaded && !error && konfluxPublicInfo?.integrations?.image_controller?.notifications) {
    return konfluxPublicInfo.integrations.image_controller.notifications;
  }
  return [];
};

export const useInstanceVisibility = (): KonfluxInstanceVisibilityType => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  if (loaded && !error && konfluxPublicInfo) {
    return konfluxPublicInfo.visibility || KonfluxInstanceVisibility.PUBLIC;
  }
  return KonfluxInstanceVisibility.PUBLIC;
};
