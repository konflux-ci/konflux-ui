import React from 'react';
import { EmptyStateBody, PageSection, PageSectionVariants, Title } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { ExternalLink } from '~/shared';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import emptyStateImgUrl from '../../assets/Components.svg';
import { LEARN_MORE_ABOUT_COMPONENTS } from '../../consts/documentation';
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
          <AppEmptyState
            className="pf-v5-u-mx-lg"
            isXl
            emptyStateImg={emptyStateImgUrl}
            title="Bring your code to Konflux"
          >
            <EmptyStateBody>
              A component is an image built from source code in a repository. One or more components
              can be grouped to form a component group.
              <br />
              To get started, create a new component.
            </EmptyStateBody>
          </AppEmptyState>
        </PageSection>
      </PageLayout>
    </IfFeature>
  );
};
export default ComponentsPage;
