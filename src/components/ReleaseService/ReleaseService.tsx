import * as React from 'react';
import { Link } from 'react-router-dom';
import { ReleasePlanModel } from '../../models';
import { RELEASEPLAN_CREATE_PATH } from '../../routes/paths';
import { useNamespace } from '../../shared/providers/Namespace';
import { useAccessReviewForModel } from '../../utils/rbac';
import { DetailsPage } from '../DetailsPage';

export const ReleaseService: React.FC<React.PropsWithChildren<unknown>> = () => {
  const namespace = useNamespace();
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
              <Link to={RELEASEPLAN_CREATE_PATH.createPath({ workspaceName: namespace })}>
                Create release plan
              </Link>
            ),
            disabled: !canCreateReleasePlan,
            disabledTooltip: "You don't have access to create a release plan",
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
