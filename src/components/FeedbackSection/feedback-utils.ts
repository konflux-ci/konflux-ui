import { KonfluxPublicInfo } from '~/types/konflux-public-info';
import { FEEDBACK_BASE_URL } from './consts';

export interface BugInfo {
  title: string;
  description: string;
  getAdditionalInfo?: boolean;
}

export interface FeatureInfo {
  title: string;
  description: string;
}

type GetBugURL = (bug: BugInfo, konfluxInfo: KonfluxPublicInfo) => string;
type GetFeatureURL = (bug: BugInfo) => string;

export const getBugURL: GetBugURL = (bug, konfluxInfo) => {
  const environment = `environment: ${konfluxInfo?.environment ? konfluxInfo.environment : 'unavailable'},
clusterVersion: ${konfluxInfo?.clusterVersion ? konfluxInfo.clusterVersion : 'unavailable'},
konfluxVersion: ${konfluxInfo?.konfluxVersion ? konfluxInfo.konfluxVersion : 'unavailable'},
kubernetesVersion: ${konfluxInfo?.kubernetesVersion ? konfluxInfo.kubernetesVersion : 'unavailable'},
openshiftVersion: ${konfluxInfo?.openshiftVersion ? konfluxInfo.openshiftVersion : 'unavailable'},`;

  const info = {
    'bug-title': bug.title,
    'bug-description': bug.description,
    'user-agent': bug.getAdditionalInfo ? window.navigator.userAgent : null,
    environment: bug.getAdditionalInfo ? environment : null,
    'image-proxy': bug.getAdditionalInfo ? JSON.stringify(konfluxInfo?.imageProxy?.url) : null,
  };

  // update to use correct URL params
  const additionalInfoURL = bug.getAdditionalInfo
    ? `&user-agent=${encodeURIComponent(info['user-agent'])}&environment=${encodeURIComponent(info.environment)}&image-proxy=${encodeURIComponent(info['image-proxy'])}`
    : '';
  const url = `${FEEDBACK_BASE_URL}title=${encodeURIComponent(info['bug-title'])}&template=bug_report.yml&bug-description=${encodeURIComponent(info['bug-description'])}${additionalInfoURL}`;
  return url;
};

export const getFeatureURL: GetFeatureURL = (feature) => {
  const info = {
    'feature-title': feature.title,
    'feature-description': feature.description,
  };
  // update to use correct URL params
  const url = `${FEEDBACK_BASE_URL}title=${encodeURIComponent(info['feature-title'])}&template=feature_request.yml&feature-description=${encodeURIComponent(info['feature-description'])}`;
  return url;
};
