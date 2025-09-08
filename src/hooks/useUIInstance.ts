import React from 'react';
import { PLACEHOLDER, REPO_PUSH, SBOM_EVENT_TO_BOMBINO } from '../consts/constants';
import {
  KonfluxInstanceEnvironments,
  KonfluxInstanceEnvironmentType,
  KonfluxInstanceVisibility,
  KonfluxInstanceVisibilityType,
  SBOMEventNotification,
} from '../types/konflux-public-info';
import { useKonfluxPublicInfo } from './useKonfluxPublicInfo';

export const useUIInstance = (): KonfluxInstanceEnvironmentType => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  if (loaded && !error && konfluxPublicInfo) {
    return konfluxPublicInfo.environment || KonfluxInstanceEnvironments.PRODUCTION;
  }
  return KonfluxInstanceEnvironments.PRODUCTION;
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
