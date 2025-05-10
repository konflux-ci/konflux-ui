import { PageSection } from '@patternfly/react-core';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { KonfluxBanner } from '../konfluxBanner/KonfluxBanner';
import AboutSection from './AboutSection';
import InfoBanner from './InfoBanner';
import IntroBanner from './IntroBanner';

export const Overview: React.FC = () => {
  useDocumentTitle('Overview | Konflux');
  return (
    <PageSection>
      <KonfluxBanner />
      <IntroBanner />
      <InfoBanner />
      <PageSection isFilled>
        <AboutSection />
      </PageSection>
    </PageSection>
  );
};
