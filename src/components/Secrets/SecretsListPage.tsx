import React from 'react';
import { Divider, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FULL_APPLICATION_TITLE } from '../../consts/labels';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { useWorkspaceBreadcrumbs } from '../../utils/breadcrumb-utils';
import PageLayout from '../PageLayout/PageLayout';
import SecretsListView from './SecretsListView/SecretsListView';

const SecretsListPage: React.FC = () => {
  const breadcrumbs = useWorkspaceBreadcrumbs();

  useDocumentTitle(`Secrets | ${FULL_APPLICATION_TITLE}`);
  return (
    <PageLayout
      title="Secrets"
      description={
        <>
          Manage your secrets and their related configurations. You can add a secret at the
          namespace level.
          <br /> All secrets are stored using AWS Secrets Manager to keep your data private.{' '}
          <ExternalLink href="https://konflux-ci.dev/docs/how-tos/configuring/creating-secrets/">
            Learn more
          </ExternalLink>
        </>
      }
      breadcrumbs={[
        ...breadcrumbs,
        {
          path: '#',
          name: 'Secrets',
        },
      ]}
    >
      <Divider style={{ background: 'white', paddingTop: 'var(--pf-v5-global--spacer--md)' }} />

      <PageSection variant={PageSectionVariants.light} isFilled>
        <SecretsListView />
      </PageSection>
    </PageLayout>
  );
};

export default SecretsListPage;
