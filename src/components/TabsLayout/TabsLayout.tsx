import * as React from 'react';
import { Outlet, resolvePath, useLocation, useNavigate, useResolvedPath } from 'react-router-dom';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { FULL_APPLICATION_TITLE } from '../../consts/labels';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HttpError } from '../../k8s/error';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { TabProps } from './types';

type TabsLayoutProps = {
  id: string;
  tabs: TabProps[];
  onTabSelect?: (selectedTabKey: string) => void;
  baseURL?: string;
  headTitle?: string;
  className?: string;
  style?: React.CSSProperties;
};

const INDEX = 'index';
const getRouteFromKey = (key: string): string => (key === INDEX ? '' : key);

// Helper function to extract string content from React.ReactNode for string operations
const getStringFromLabel = (label: React.ReactNode): string => {
  if (typeof label === 'string') {
    return label;
  }
  if (typeof label === 'number') {
    return label.toString();
  }
  if (React.isValidElement(label)) {
    if (typeof label.props.children === 'string') {
      return label.props.children;
    }
    if (Array.isArray(label.props.children)) {
      return label.props.children
        .map((child: React.ReactNode) => getStringFromLabel(child))
        .filter(Boolean)
        .join(' ');
    }
    return getStringFromLabel(label.props.children as React.ReactNode);
  }
  if (Array.isArray(label)) {
    return label
      .map((item: React.ReactNode) => getStringFromLabel(item))
      .filter(Boolean)
      .join(' ');
  }
  return '';
};

export const TabsLayout: React.FC<TabsLayoutProps> = ({
  id,
  tabs,
  onTabSelect,
  baseURL,
  headTitle,
  className,
  style,
}) => {
  const location = useLocation();
  const resolveBase = useResolvedPath('.');
  const basePath = baseURL ?? resolveBase.pathname;
  const currentTab = tabs
    // @ts-expect-error Array types doesn't include toReversed
    ?.toReversed()
    ?.find?.((t: TabProps) =>
      location.pathname.includes(resolvePath(getRouteFromKey(t.key), basePath).pathname),
    )?.key;

  const activeTabKey: string = React.useMemo(
    () => currentTab || tabs?.[0]?.key,
    [currentTab, tabs],
  );
  const navigate = useNavigate();
  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (activeTabKey !== newTab) {
        navigate(
          // maintain traling slash consistency, prevent addition of extra slash
          `${basePath}${basePath[basePath.length - 1] !== '/' ? '/' : ''}${newTab ? `${getRouteFromKey(newTab)}` : ''}`,
        );
      }
    },
    [activeTabKey, navigate, basePath],
  );

  const activeTab: TabProps = React.useMemo(
    () => tabs?.find((t) => (t.partial ? activeTabKey.startsWith(t.key) : t.key === activeTabKey)),
    [activeTabKey, tabs],
  );

  useDocumentTitle(
    `${headTitle} - ${getStringFromLabel(activeTab.label)} | ${FULL_APPLICATION_TITLE}`,
  );

  if (!activeTab) {
    return <ErrorEmptyState httpError={HttpError.fromCode(404)} />;
  }

  const tabComponents = tabs?.map(({ key, label, featureFlag, ...rest }) => {
    const labelString = getStringFromLabel(label);
    return (
      <Tab
        data-test={`${id}__tabItem ${labelString.toLocaleLowerCase().replace(/\s/g, '')}`}
        key={key}
        eventKey={key}
        title={
          <TabTitleText>
            {label} {featureFlag && <FeatureFlagIndicator flags={featureFlag} />}
          </TabTitleText>
        }
        {...rest}
      >
        <Outlet />
      </Tab>
    );
  });

  return (
    <Tabs
      data-test={`${id}__tabs`}
      onSelect={(_, k: string) => {
        setActiveTab(k);
        onTabSelect && onTabSelect(k);
      }}
      className={className}
      style={style}
      mountOnEnter
      unmountOnExit
      activeKey={activeTab.key}
    >
      {tabComponents}
    </Tabs>
  );
};
