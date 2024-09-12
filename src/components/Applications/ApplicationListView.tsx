import * as React from 'react';
// import { Link } from 'react-router-dom';
import {
  Bullseye,
  EmptyStateBody,
  PageSection,
  PageSectionVariants,
  Spinner,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Application.svg';
// import imageUrl from '../../imgs/getting-started-illustration.svg';
import { useApplications } from '../../hooks/useApplications';
// import { ApplicationModel, ComponentModel } from '../../models';
import { Table } from '../../shared';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';
import { ApplicationKind } from '../../types';
// import { useAccessReviewForModel } from '../../utils/rbac';
// import { useWorkspaceInfo } from '../../utils/workspace-context-utils';
// import { ButtonWithAccessTooltip } from '../ButtonWithAccessTooltip';
// import { GettingStartedCard } from '../GettingStartedCard/GettingStartedCard';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import PageLayout from '../PageLayout/PageLayout';
import { useWorkspaceInfo } from '../Workspace/workspace-context';
import { ApplicationListHeader } from './ApplicationListHeader';
import ApplicationListRow from './ApplicationListRow';

const ApplicationListView: React.FC<React.PropsWithChildren<unknown>> = () => {
  const { namespace, workspace } = useWorkspaceInfo();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  // const [canCreateApplication] = useAccessReviewForModel(ApplicationModel, 'create');
  // const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');

  const [applications, loaded] = useApplications(namespace, workspace);
  applications?.sort(
    (app1, app2) =>
      +new Date(app2.metadata?.creationTimestamp) - +new Date(app1.metadata?.creationTimestamp),
  );

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  return (
    <>
      <PageLayout
        breadcrumbs={applicationBreadcrumbs}
        title="Applications"
        description="An application is 1 or more components running together for building and releasing."
      >
        <PageSection
          padding={{ default: 'noPadding' }}
          variant={PageSectionVariants.light}
          isFilled
        >
          {!applications || applications.length === 0 ? (
            <AppEmptyState
              className="pf-v5-u-mx-lg"
              isXl
              emptyStateImg={emptyStateImgUrl}
              title="Easily onboard your applications"
            >
              <EmptyStateBody>
                Automate the building, testing, and deploying of your applications with just a few
                clicks.
                <br />
                To get started, create an application.
              </EmptyStateBody>
              {/* <ButtonWithAccessTooltip
                variant="primary"
                component={(props) => (
                  <Link {...props} to={`/workspaces/${workspace}/import`} />
                )}
                isDisabled={!(canCreateApplication && canCreateComponent)}
                tooltip="You don't have access to create an application"
                analytics={{
                  link_name: 'create-application',
                  workspace,
                }}
              >
                Create application
              </ButtonWithAccessTooltip> */}
            </AppEmptyState>
          ) : (
            <>
              <Toolbar usePageInsets>
                <ToolbarContent>
                  <ToolbarItem>
                    {/* <ButtonWithAccessTooltip
                      variant="primary"
                      component={(props) => (
                        <Link
                          {...props}
                          to={`/workspaces/${workspace}/import`}
                        />
                      )}
                      isDisabled={!(canCreateApplication && canCreateComponent)}
                      tooltip="You don't have access to create an application"
                      analytics={{
                        link_name: 'create-application',
                        workspace,
                      }}
                    >
                      Create application
                    </ButtonWithAccessTooltip> */}
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
              <Table
                data={applications}
                aria-label="Application List"
                Header={ApplicationListHeader}
                Row={ApplicationListRow}
                loaded
                getRowProps={(obj: ApplicationKind) => ({
                  id: obj.metadata?.name,
                })}
              />
            </>
          )}
        </PageSection>
      </PageLayout>
    </>
  );
};

export default ApplicationListView;
