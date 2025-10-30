import React from 'react';
import { Divider, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import PageLayout from '~/components/PageLayout/PageLayout';
import { LEARN_MORE_ABOUT_SECRETS_CREATION } from '~/consts/documentation';
import { FULL_APPLICATION_TITLE } from '~/consts/labels';
import { useDocumentTitle } from '~/hooks/useDocumentTitle';
import ExternalLink from '~/shared/components/links/ExternalLink';
import SecretsListView from './SecretsListView/SecretsListView';

const SecretsListPage: React.FC = () => {
  useDocumentTitle(`Secrets | ${FULL_APPLICATION_TITLE}`);
  return (
    <PageLayout
      title="Secrets"
      description={
        <>
          Manage your secrets and their related configurations. You can add a secret at the
          namespace level.
          <br /> All secrets are stored using AWS Secrets Manager to keep your data private.{' '}
          <ExternalLink href={LEARN_MORE_ABOUT_SECRETS_CREATION}>Learn more</ExternalLink>
        </>
      }
    >
      <Divider style={{ paddingTop: 'var(--pf-v5-global--spacer--md)' }} />

      <PageSection variant={PageSectionVariants.light} isFilled>
        <FilterContextProvider filterParams={['name']}>
          <SecretsListView />
        </FilterContextProvider>
      </PageSection>
    </PageLayout>
  );
};

export default SecretsListPage;
