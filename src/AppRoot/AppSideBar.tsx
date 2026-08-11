import * as React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Nav, NavItem, NavList, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import {
  APPLICATION_LIST_PATH,
  COMPONENTS_PATH,
  DEPENDENCY_SCHEDULE_PATH,
  GROUPS_PATH,
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
import {
  SavedViewNavItems,
  SavedViewNavSection,
  type SavedViewsConfig,
} from '~/shared/components/SavedViews';
import { useActiveRouteChecker } from '../../src/hooks/useActiveRouteChecker';
import { useNamespace } from '../shared/providers/Namespace';
import './AppSideBar.scss';

export const AppSideBar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const isActive = useActiveRouteChecker();
  const namespace = useNamespace();
  const disabled = !namespace;

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

            <IfFeature flag="component-model">
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
                    flags={['component-model']}
                    hasNoPadding
                    popOverTriggerAction="hover"
                  />
                </Link>
              </NavItem>
            </IfFeature>

            <IfFeature flag="component-model">
              <NavItem
                className={css({ 'app-side-bar__nav-item--disabled': disabled })}
                isActive={isActive(GROUPS_PATH.path)}
              >
                <Link
                  to={namespace ? GROUPS_PATH.createPath({ workspaceName: namespace }) : undefined}
                >
                  Groups{' '}
                  <FeatureFlagIndicator
                    flags={['component-model']}
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
              <SavedViewNavSection
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
                config={pipelineRunsSavedViewsConfig}
                isActive={isActive(PIPELINE_RUNS_PAGE_PATH.path)}
                disabled={disabled}
                href={
                  namespace
                    ? PIPELINE_RUNS_PAGE_PATH.createPath({ workspaceName: namespace })
                    : undefined
                }
                data-test="pipeline-runs-nav-group"
              />
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

            <IfFeature flag="pipeline-runs-page">
              {namespace && <SavedViewNavItems config={pipelineRunsSavedViewsConfig} />}
            </IfFeature>

            <IfFeature flag="mintmaker">
              <NavItem isActive={isActive(DEPENDENCY_SCHEDULE_PATH.path)}>
                <NavLink to={DEPENDENCY_SCHEDULE_PATH.createPath({} as never)}>
                  Dependency updates schedule{' '}
                  <FeatureFlagIndicator
                    flags={['mintmaker']}
                    hasNoPadding
                    popOverTriggerAction="hover"
                  />
                </NavLink>
              </NavItem>
            </IfFeature>
          </NavList>
        </Nav>
      </PageSidebarBody>
    </PageSidebar>
  );
};
