import {
  KonfluxInstanceEnvironments,
  KonfluxInstanceVisibility,
} from '~/types/konflux-public-info';
import { FEEDBACK_BASE_URL } from '../consts';
import { getBugURL, getFeatureURL } from '../feedback-utils';

describe('Feedback utils', () => {
  const bugInfo = { title: 'my-title', description: 'my-description' };
  const featureInfo = { title: 'feature-title', description: 'my-feature' };
  const konfluxInfo = {
    imageProxy: { url: "image-proxy-url", oauthPath: null },
    environment: KonfluxInstanceEnvironments.STAGING,
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
    expect(url).toBe(
      `${FEEDBACK_BASE_URL}title=my-title&template=bug_report.yml&bug-description=my-description&user-agent=${encodeURIComponent(window.navigator.userAgent)}&environment=staging&image-proxy=%22image-proxy-url%22`,
    );
  });

  it('should return correct url for Feature', () => {
    const url = getFeatureURL(featureInfo);
    expect(url).toBe(
      `${FEEDBACK_BASE_URL}title=feature-title&template=feature_request.yml&feature-description=my-feature`,
    );
  });
});
