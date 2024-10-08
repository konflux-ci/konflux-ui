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

const SBOM_PLACEHOLDER = '<PLACEHOLDER>';
const getSBOMEnvUrl = (env: ConsoleDotEnvironments) => (imageHash: string) => {
  if (env === ConsoleDotEnvironments.prod) {
    return `https://atlas.devshift.net/sbom/content/${SBOM_PLACEHOLDER}`.replace(
      SBOM_PLACEHOLDER,
      imageHash,
    );
  }
  return `https://atlas.stage.devshift.net/sbom/content/${SBOM_PLACEHOLDER}`.replace(
    SBOM_PLACEHOLDER,
    imageHash,
  );
};

const getBombinoUrl = (env: ConsoleDotEnvironments) => {
  if (env === ConsoleDotEnvironments.prod) {
    return 'https://bombino.api.redhat.com/v1/sbom/quay/push';
  }
  return 'https://bombino.preprod.api.redhat.com/v1/sbom/quay/push';
};

export const useSbomUrl = () => getSBOMEnvUrl(useUIInstance());

export const useBombinoUrl = () => getBombinoUrl(useUIInstance());
