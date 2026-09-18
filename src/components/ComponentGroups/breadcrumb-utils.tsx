import { Link, useParams } from 'react-router-dom';
import { BreadcrumbItem } from '@patternfly/react-core';
import { GROUP_DETAILS_PATH, GROUPS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';

export const useComponentGroupBreadcrumbs = () => {
  const { groupName } = useParams<RouterParams>();

  const namespace = useNamespace();

  return [
    <BreadcrumbItem key="component-groups-link" component="div" showDivider>
      {groupName ? (
        <Link
          data-test="component-groups-breadcrumb-link"
          className="pf-v6-c-breadcrumb__link"
          to={GROUPS_PATH.createPath({ workspaceName: namespace })}
        >
          Groups
        </Link>
      ) : (
        <span>Groups</span>
      )}
    </BreadcrumbItem>,
    ...(groupName
      ? [
          {
            path: GROUP_DETAILS_PATH.createPath({ workspaceName: namespace, groupName }),
            name: groupName,
          },
        ]
      : []),
  ];
};
