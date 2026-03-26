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
  const info = {
    'bug-title': bug.title,
    'bug-description': bug.description,
  };

  const additionalInfoSection = bug.getAdditionalInfo
    ? {
        'user-agent': window.navigator.userAgent,
        environment: konfluxInfo?.environment,
        'image-proxy': JSON.stringify(konfluxInfo?.imageProxy?.url),
      }
    : null;

  const additionalInfoVersions = bug.getAdditionalInfo
    ? `cluster-version: ${konfluxInfo?.clusterVersion},
konflux-version: ${konfluxInfo?.konfluxVersion},
kubernetes-version: ${konfluxInfo?.kubernetesVersion},
openshift-version: ${konfluxInfo?.openshiftVersion},`
    : null;

  // update to use correct URL params
  const additionalInfoURL =
    additionalInfoSection != null
      ? `&${new URLSearchParams(
          Object.entries(additionalInfoSection).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (value) acc[key] = String(value);
              return acc;
            },
            {},
          ),
        ).toString()}`
      : '';

  const additionalInfoVersionsURL =
    additionalInfoVersions != null
      ? `&additional-info=${encodeURIComponent(additionalInfoVersions)}`
      : '';
  const url = `${FEEDBACK_BASE_URL}title=${encodeURIComponent(info['bug-title'])}&template=bug_report.yml&bug-description=${encodeURIComponent(info['bug-description'])}${additionalInfoURL}${additionalInfoVersionsURL}`;
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
