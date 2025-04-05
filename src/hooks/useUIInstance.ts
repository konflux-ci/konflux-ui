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
  const notification = notifications?.find(
    (n) => n.title === 'SBOM-event-to-Bombino' && n.event === 'repo_push',
  );
  return notification?.config?.url ?? '';
};

export const useSbomUrl = (): ((imageHash: string) => string) => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  return (imageHash: string) => {
    if (loaded && !error) {
      const sbomServerUrl = konfluxPublicInfo.integrations.sbom_server.url ?? '';
      return sbomServerUrl.replace('<PLACEHOLDER>', imageHash);
    }
  };
};

export const useBombinoUrl = (): string | undefined => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();

  if (loaded && !error && konfluxPublicInfo) {
    const notifications = konfluxPublicInfo.integrations.image_controller.notifications;
    return getBombinoUrl(notifications);
  }
  return undefined;
};

export const useApplicationUrl = (): string | undefined => {
  const [konfluxPublicInfo, loaded, error] = useKonfluxPublicInfo();
  if (loaded && !error && konfluxPublicInfo) {
    return konfluxPublicInfo.integrations.github.application_url;
  }
  return undefined;
};
