import React from 'react';
import { Divider, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { USER_ACCESS_GRANT_PAGE } from '@routes/paths';
import { FULL_APPLICATION_TITLE } from '../../consts/labels';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { RoleBindingModel } from '../../models';
import { useNamespace } from '../../shared/providers/Namespace';
import { useAccessReviewForModel } from '../../utils/rbac';
import { FilterContextProvider } from '../Filter/generic/FilterContext';
import PageLayout from '../PageLayout/PageLayout';
import { UserAccessListView } from './UserAccessListView';

const UserAccessPage: React.FunctionComponent = () => {
  const namespace = useNamespace();

  const [canCreateRB] = useAccessReviewForModel(RoleBindingModel, 'create');

  useDocumentTitle(`User access | ${FULL_APPLICATION_TITLE}`);

  return (
    <PageLayout
      title="User access"
      description="Invite users to collaborate with you by granting them access to your namespace."
      actions={[
        {
          id: 'grant-access',
          label: 'Grant access',
          disabled: !canCreateRB,
          disabledTooltip: 'You cannot grant access in this namespace',
          cta: {
            href: USER_ACCESS_GRANT_PAGE.createPath({ workspaceName: namespace }),
          },
        },
      ]}
    >
      <Divider style={{ paddingTop: 'var(--pf-v5-global--spacer--md)' }} />
      <PageSection variant={PageSectionVariants.light} isFilled>
        <FilterContextProvider filterParams={['username']}>
          <UserAccessListView />
        </FilterContextProvider>
      </PageSection>
    </PageLayout>
  );
};

export default UserAccessPage;
