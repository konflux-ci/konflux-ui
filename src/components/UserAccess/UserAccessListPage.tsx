import React from 'react';
import { Divider, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FULL_APPLICATION_TITLE } from '../../consts/labels';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { RoleBindingModel } from '../../models';
import { useNamespace } from '../../shared/providers/Namespace';
import { useWorkspaceBreadcrumbs } from '../../utils/breadcrumb-utils';
import { useAccessReviewForModel } from '../../utils/rbac';
import PageLayout from '../PageLayout/PageLayout';
import { UserAccessListView } from './UserAccessListView';

const UserAccessPage: React.FunctionComponent = () => {
  const breadcrumbs = useWorkspaceBreadcrumbs();
  const namespace = useNamespace();

  const [canCreateRB] = useAccessReviewForModel(RoleBindingModel, 'create');

  useDocumentTitle(`User access | ${FULL_APPLICATION_TITLE}`);

  return (
    <PageLayout
      title="User access"
      description="Invite users to collaborate with you by granting them access to your namespace."
      breadcrumbs={[
        ...breadcrumbs,
        {
          path: '#',
          name: 'User access',
        },
      ]}
      actions={[
        {
          id: 'grant-access',
          label: 'Grant access',
          disabled: !canCreateRB,
          disabledTooltip: 'You cannot grant access in this namespace',
          cta: {
            href: `/workspaces/${namespace}/access/grant`,
          },
        },
      ]}
    >
      <Divider style={{ background: 'white', paddingTop: 'var(--pf-v5-global--spacer--md)' }} />
      <PageSection variant={PageSectionVariants.light} isFilled>
        <UserAccessListView />
      </PageSection>
    </PageLayout>
  );
};

export default UserAccessPage;
