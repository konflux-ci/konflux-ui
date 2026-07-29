import { PageSection } from '@patternfly/react-core';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import AboutSection from './AboutSection';
import InfoBanner from './InfoBanner';
import IntroBanner from './IntroBanner';

export const Overview: React.FC = () => {
  useDocumentTitle('Overview | Konflux');
  return (
    <PageSection hasBodyWrapper={false}>
      <IntroBanner />
      <InfoBanner />
      <PageSection hasBodyWrapper={false} isFilled>
        <AboutSection />
      </PageSection>
    </PageSection>
  );
};
