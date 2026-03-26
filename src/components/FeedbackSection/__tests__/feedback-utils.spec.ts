import {
  KonfluxInstanceEnvironments,
  KonfluxInstanceVisibility,
  type KonfluxPublicInfo,
} from '~/types/konflux-public-info';
import { FEEDBACK_BASE_URL } from '../consts';
import { getBugURL, getFeatureURL } from '../feedback-utils';

describe('Feedback utils', () => {
  const bugInfo = { title: 'my-title', description: 'my-description' };
  const featureInfo = { title: 'feature-title', description: 'my-feature' };
  const konfluxInfo: KonfluxPublicInfo = {
    imageProxy: { url: 'image-proxy-url', oauthPath: '' },
    environment: KonfluxInstanceEnvironments.STAGING,
    clusterVersion: '4.15.3',
    konfluxVersion: '1.2.3',
    kubernetesVersion: '1.29.0',
    openshiftVersion: '4.15.0',
    rbac: [],
    visibility: KonfluxInstanceVisibility.PRIVATE,
  };
  it('should return correct url for Bug', () => {
    const url = getBugURL({ ...bugInfo, getAdditionalInfo: false }, null);
    expect(url).toBe(
      `${FEEDBACK_BASE_URL}title=my-title&template=bug_report.yml&bug-description=my-description`,
    );
  });

  it('should return correct url for with Additional info', () => {
    const url = getBugURL({ ...bugInfo, getAdditionalInfo: true }, konfluxInfo);
    const { searchParams } = new URL(url);

    expect(searchParams.get('title')).toBe('my-title');
    expect(searchParams.get('template')).toBe('bug_report.yml');
    expect(searchParams.get('bug-description')).toBe('my-description');
    expect(searchParams.get('user-agent')).toBe(window.navigator.userAgent);

    const environment = searchParams.get('environment') ?? '';
    expect(environment).toContain(`environment: ${konfluxInfo.environment}`);
    expect(environment).toContain(`clusterVersion: ${konfluxInfo.clusterVersion}`);
    expect(environment).toContain(`konfluxVersion: ${konfluxInfo.konfluxVersion}`);
    expect(environment).toContain(`kubernetesVersion: ${konfluxInfo.kubernetesVersion}`);
    expect(environment).toContain(`openshiftVersion: ${konfluxInfo.openshiftVersion}`);

    expect(searchParams.get('image-proxy')).toBe(JSON.stringify(konfluxInfo.imageProxy?.url));
  });

  it('should return correct url for Feature', () => {
    const url = getFeatureURL(featureInfo);
    expect(url).toBe(
      `${FEEDBACK_BASE_URL}title=feature-title&template=feature_request.yml&feature-description=my-feature`,
    );
  });
});
