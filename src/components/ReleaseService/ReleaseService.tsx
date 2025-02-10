import * as React from 'react';
import { Link } from 'react-router-dom';
import { ReleasePlanModel } from '../../models';
import { useWorkspaceBreadcrumbs } from '../../utils/breadcrumb-utils';
import { useAccessReviewForModel } from '../../utils/rbac';
import { DetailsPage } from '../DetailsPage';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';

export const ReleaseService: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { workspace } = useWorkspaceInfo();
  const breadcrumbs = useWorkspaceBreadcrumbs();
  const [canCreateReleasePlan] = useAccessReviewForModel(ReleasePlanModel, 'create');
  return (
    <>
      <DetailsPage
        data-test="release-service-test-id"
        title="Releases"
        headTitle="Releases"
        description="Manage all your releases in this namespace."
        actions={[
          {
            key: 'create-release-plan',
            id: 'create-release-plan',
            label: 'Create release plan',
            component: (
              <Link to={`/workspaces/${workspace}/release/release-plan/create`}>
                Create release plan
              </Link>
            ),
            disabled: !canCreateReleasePlan,
            disabledTooltip: "You don't have access to create a release plan",
          },
        ]}
        breadcrumbs={[
          ...breadcrumbs,
          {
            path: '#',
            name: 'Releases',
          },
        ]}
        tabs={[
          {
            key: 'index',
            label: 'Release Plan',
            isFilled: true,
          },
          {
            key: 'release-plan-admission',
            label: 'Release Plan Admission',
          },
        ]}
      />
    </>
  );
};
