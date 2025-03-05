import * as React from 'react';
import { useLocation } from 'react-router-dom';
import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import PageLayout from '../PageLayout/PageLayout';
import { GitImportForm } from './GitImportForm';

const ImportForm: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isApplication = queryParams.get('isApplication') === 'true';

  const applicationTitle = `Create an ${isApplication ? 'Application' : 'Component'}`;
  const applicationName = new URLSearchParams(window.location.search).get('application');
  const applicationBreadcrumbs = useApplicationBreadcrumbs(applicationName);
  return (
    <PageLayout
      breadcrumbs={[...applicationBreadcrumbs, { path: '#', name: applicationTitle }]}
      title={applicationTitle}
      description={
        <>
          An application is one or more components that run together.{' '}
          <ExternalLink href="https://konflux-ci.dev/docs/how-tos/creating/">
            Learn more
          </ExternalLink>
        </>
      }
    >
      <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
        <GitImportForm applicationName={applicationName} />
      </PageSection>
    </PageLayout>
  );
};

export default ImportForm;
