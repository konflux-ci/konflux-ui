import React from 'react';
import { PageSection, PageSectionVariants, Title } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { ExternalLink } from '~/shared';
import { LEARN_MORE_ABOUT_COMPONENTS } from '../../consts/documentation';
import ComponentList from '../ComponentList/ComponentList';
import PageLayout from '../PageLayout/PageLayout';

const ComponentsPage: React.FC = () => {
  return (
    <IfFeature flag="components-page">
      <PageLayout
        title={
          <Title headingLevel="h1" size="2xl">
            Components <FeatureFlagIndicator flags={['components-page']} fullLabel />
          </Title>
        }
        description={
          <>
            A component is an image built from source code in a repository.{' '}
            <ExternalLink href={LEARN_MORE_ABOUT_COMPONENTS}>Learn more</ExternalLink>
          </>
        }
      >
        <PageSection
          padding={{ default: 'noPadding' }}
          variant={PageSectionVariants.light}
          isFilled
        >
          <ComponentList />
        </PageSection>
      </PageLayout>
    </IfFeature>
  );
};
export default ComponentsPage;
