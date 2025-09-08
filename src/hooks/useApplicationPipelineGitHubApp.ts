import { KonfluxInstanceEnvironments } from '~/types/konflux-public-info';
import { useUIInstance } from './useUIInstance';

type ApplicationPipelineGitHubAppDataType = {
  url: string;
  name: string;
};

export const ApplicationPipelineGitHubAppData: {
  [env: string]: ApplicationPipelineGitHubAppDataType;
} = {
  dev: { url: 'https://github.com/apps/konflux-staging', name: 'konflux-staging' },
  stage: {
    url: 'https://github.com/apps/konflux-staging',
    name: 'konflux-staging',
  },
  prod: {
    url: 'https://github.com/apps/red-hat-konflux',
    name: 'red-hat-konflux',
  },
};

export const useApplicationPipelineGitHubApp = (): ApplicationPipelineGitHubAppDataType => {
  const environment = useUIInstance();

  switch (environment) {
    case KonfluxInstanceEnvironments.PRODUCTION:
      return ApplicationPipelineGitHubAppData.prod;
    case KonfluxInstanceEnvironments.STAGING:
      return ApplicationPipelineGitHubAppData.stage;
    default:
      return ApplicationPipelineGitHubAppData.dev;
  }
};
