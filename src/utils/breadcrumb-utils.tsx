import { Link, useParams } from 'react-router-dom';
import { BreadcrumbItem } from '@patternfly/react-core';
import { ApplicationSwitcher } from '../components/Applications/switcher/ApplicationSwitcher';
import { useWorkspaceInfo } from '../components/Workspace/useWorkspaceInfo';
import { WorkspaceSwitcher } from '../components/Workspace/WorkspaceSwitcher';
import { RouterParams } from '../routes/utils';

export const useWorkspaceBreadcrumbs = () => {
  const { workspace } = useWorkspaceInfo();

  return [
    <BreadcrumbItem key="workspace-label" component="div">
      <span>Namespaces</span>
    </BreadcrumbItem>,
    <BreadcrumbItem key="workspace-link" to="#" component="div" showDivider>
      <Link className="pf-v5-c-breadcrumb__link" to={`/workspaces/${workspace}/applications`}>
        {workspace}
      </Link>
    </BreadcrumbItem>,
    <WorkspaceSwitcher key="workspace" />,
  ];
};

export const useApplicationBreadcrumbs = (appDisplayName = null, withLink = true) => {
  const params = useParams<RouterParams>();
  const applicationName = params.applicationName || appDisplayName;

  const { workspace } = useWorkspaceInfo();
  const workspaceBreadcrumbs = useWorkspaceBreadcrumbs();

  return [
    ...workspaceBreadcrumbs,
    <BreadcrumbItem key="app-link" component="div" showDivider>
      {applicationName ? (
        <Link
          data-test="applications-breadcrumb-link"
          className="pf-v5-c-breadcrumb__link"
          to={`/workspaces/${workspace}/applications`}
        >
          Applications
        </Link>
      ) : (
        <span>Applications</span>
      )}
    </BreadcrumbItem>,
    ...(applicationName
      ? [
          {
            path: withLink ? `/workspaces/${workspace}/applications/${applicationName}` : '',
            name: appDisplayName || applicationName,
          },
          <ApplicationSwitcher key="app" selectedApplication={applicationName} />,
        ]
      : []),
  ];
};
