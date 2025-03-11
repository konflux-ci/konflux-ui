import { Link, useParams } from 'react-router-dom';
import { BreadcrumbItem } from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { ApplicationSwitcher } from '../components/Applications/switcher/ApplicationSwitcher';
import { RouterParams } from '../routes/utils';

export const useApplicationBreadcrumbs = (appDisplayName = null, withLink = true) => {
  const params = useParams<RouterParams>();
  const applicationName = params.applicationName || appDisplayName;

  const namepsace = useNamespace();

  return [
    <BreadcrumbItem key="app-link" component="div" showDivider>
      {applicationName ? (
        <Link
          data-test="applications-breadcrumb-link"
          className="pf-v5-c-breadcrumb__link"
          to={`/workspaces/${namepsace}/applications`}
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
            path: withLink ? `/workspaces/${namepsace}/applications/${applicationName}` : '',
            name: appDisplayName || applicationName,
          },
          <ApplicationSwitcher key="app" selectedApplication={applicationName} />,
        ]
      : []),
  ];
};
