import * as React from 'react';
import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import { LEARN_MORE_ABOUT_CREATING_APPLICATIONS } from '../../consts/documentation';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { useApplicationBreadcrumbs } from '../Applications/breadcrumbs/breadcrumb-utils';
import PageLayout from '../PageLayout/PageLayout';
import { GitImportForm } from './GitImportForm';

const ImportForm: React.FC = () => {
  const applicationName = new URLSearchParams(window.location.search).get('application');
  const applicationTitle = `Create ${applicationName ? 'a Component' : 'an Application'}`;
  const applicationBreadcrumbs = useApplicationBreadcrumbs(applicationName);
  return (
    <PageLayout
      breadcrumbs={[...applicationBreadcrumbs, { path: '#', name: applicationTitle }]}
      title={applicationTitle}
      description={
        <>
          An application is one or more components that run together.{' '}
          <ExternalLink href={LEARN_MORE_ABOUT_CREATING_APPLICATIONS}>Learn more</ExternalLink>
        </>
      }
    >
      <PageSection
        variant={PageSectionVariants.light}
        padding={{ default: 'noPadding' }}
        data-test="import-form-page-section"
      >
        <GitImportForm applicationName={applicationName} />
      </PageSection>
    </PageLayout>
  );
};

export default ImportForm;
