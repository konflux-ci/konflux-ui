import * as React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Nav,
  NavExpandable,
  NavItem,
  NavList,
  PageSidebar,
  PageSidebarBody,
} from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import {
  APPLICATION_LIST_PATH,
  COMPONENTS_PATH,
  ISSUES_PATH,
  NAMESPACE_LIST_PATH,
  PIPELINE_RUNS_PAGE_PATH,
  RELEASE_MONITOR_PATH,
  RELEASE_SERVICE_PATH,
  SECRET_LIST_PATH,
  USER_ACCESS_LIST_PAGE,
} from '@routes/paths';
import IssuesNavItemContent from '~/components/Issues/IssuesNavItemContent';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { SavedViewNavItems, SavedViewsConfig } from '~/shared/components/SavedViews';
import { useActiveRouteChecker } from '../../src/hooks/useActiveRouteChecker';
import { useNamespace } from '../shared/providers/Namespace';
import './AppSideBar.scss';

export const AppSideBar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const isActive = useActiveRouteChecker();
  const namespace = useNamespace();
  const navigate = useNavigate();
  const disabled = !namespace;
  const isPipelineRunsActive = isActive(PIPELINE_RUNS_PAGE_PATH.path);
  const [isPipelineRunsExpanded, setIsPipelineRunsExpanded] = React.useState(true);

  const pipelineRunsSavedViewsConfig = React.useMemo<SavedViewsConfig>(
    () => ({
      resourceKey: 'pipeline-runs',
      columnKeyPrefix: 'prns-columns',
      routePathBuilder: (ns: string) => PIPELINE_RUNS_PAGE_PATH.createPath({ workspaceName: ns }),
    }),
    [],
  );

  return (
    <PageSidebar data-test="sidebar" isSidebarOpen={isOpen}>
      <PageSidebarBody>
        <Nav>
          <NavList>
            <NavItem isActive={isActive('/', { exact: true })}>
              <NavLink to="/">Overview</NavLink>
            </NavItem>

            <NavItem
              isActive={isActive(NAMESPACE_LIST_PATH.path, {
                exact: true,
              })}
            >
              <NavLink to={NAMESPACE_LIST_PATH.createPath({} as never)}>Namespaces</NavLink>
            </NavItem>

            <IfFeature flag="components-page">
              <NavItem
                className={css({ 'app-side-bar__nav-item--disabled': disabled })}
                isActive={isActive(COMPONENTS_PATH.path)}
              >
                <Link
                  to={
                    namespace ? COMPONENTS_PATH.createPath({ workspaceName: namespace }) : undefined
                  }
                >
                  Components{' '}
                  <FeatureFlagIndicator
                    flags={['components-page']}
                    hasNoPadding
                    popOverTriggerAction="hover"
                  />
                </Link>
              </NavItem>
            </IfFeature>

            <NavItem
              isActive={isActive(RELEASE_MONITOR_PATH.path, {
                exact: true,
              })}
            >
              <NavLink to={RELEASE_MONITOR_PATH.createPath({} as never)}>Release Monitor</NavLink>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(ISSUES_PATH.path)}
            >
              <Link
                to={namespace ? ISSUES_PATH.createPath({ workspaceName: namespace }) : undefined}
              >
                Issues {namespace ? <IssuesNavItemContent namespace={namespace} /> : null}
              </Link>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(APPLICATION_LIST_PATH.path)}
            >
              <Link
                to={
                  namespace
                    ? APPLICATION_LIST_PATH.createPath({ workspaceName: namespace })
                    : undefined
                }
              >
                Applications
              </Link>
            </NavItem>

            <IfFeature flag="pipeline-runs-page">
              <NavExpandable
                title={
                  <>
                    Pipeline Runs{' '}
                    <FeatureFlagIndicator
                      flags={['pipeline-runs-page']}
                      hasNoPadding
                      popOverTriggerAction="hover"
                    />
                  </>
                }
                isActive={isPipelineRunsActive}
                isExpanded={isPipelineRunsExpanded}
                onExpand={() => {
                  setIsPipelineRunsExpanded((prev) => !prev);
                  if (namespace) {
                    navigate(PIPELINE_RUNS_PAGE_PATH.createPath({ workspaceName: namespace }));
                  }
                }}
                className={css({ 'app-side-bar__nav-item--disabled': disabled })}
                data-test="pipeline-runs-nav-group"
              >
                {namespace && <SavedViewNavItems config={pipelineRunsSavedViewsConfig} />}
              </NavExpandable>
            </IfFeature>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(SECRET_LIST_PATH.path)}
            >
              <NavLink
                to={
                  namespace ? SECRET_LIST_PATH.createPath({ workspaceName: namespace }) : undefined
                }
              >
                Secrets
              </NavLink>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(RELEASE_SERVICE_PATH.path)}
            >
              <NavLink
                to={
                  namespace
                    ? RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace })
                    : undefined
                }
              >
                Releases
              </NavLink>
            </NavItem>

            <NavItem
              className={css({ 'app-side-bar__nav-item--disabled': disabled })}
              isActive={isActive(USER_ACCESS_LIST_PAGE.createPath({ workspaceName: namespace }))}
            >
              <NavLink
                to={
                  namespace ? USER_ACCESS_LIST_PAGE.createPath({ workspaceName: namespace }) : null
                }
              >
                User Access
              </NavLink>
            </NavItem>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
