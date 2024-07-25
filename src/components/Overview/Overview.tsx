import { PageSection } from '@patternfly/react-core';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import AboutSection from './AboutSection';
import InfoBanner from './InfoBanner';
import IntroBanner from './IntroBanner';

export const Overview: React.FC = () => {
  useDocumentTitle('Overview | Konflux');
  return (
    <PageSection>
      <IntroBanner />
      <InfoBanner />
      <PageSection isFilled>
        <AboutSection />
      </PageSection>
    </PageSection>
  );
};
