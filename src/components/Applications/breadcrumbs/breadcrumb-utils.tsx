import { Link, useParams } from 'react-router-dom';
import { BreadcrumbItem } from '@patternfly/react-core';
import { APPLICATION_DETAILS_PATH, APPLICATION_LIST_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { ApplicationSwitcher } from '../switcher/ApplicationSwitcher';

export const useApplicationBreadcrumbs = (appDisplayName = null, withLink = true) => {
  const params = useParams<RouterParams>();
  const applicationName = params.applicationName || appDisplayName;

  const namespace = useNamespace();

  return [
    <BreadcrumbItem key="app-link" component="div" showDivider>
      {applicationName ? (
        <Link
          data-test="applications-breadcrumb-link"
          className="pf-v5-c-breadcrumb__link"
          to={APPLICATION_LIST_PATH.createPath({ workspaceName: namespace })}
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
            path: withLink
              ? APPLICATION_DETAILS_PATH.createPath({ workspaceName: namespace, applicationName })
              : '',
            name: appDisplayName || applicationName,
          },
          <ApplicationSwitcher key="app" selectedApplication={applicationName} />,
        ]
      : []),
  ];
};
