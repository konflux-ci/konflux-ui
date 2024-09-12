import * as React from 'react';
import {
  matchPath,
  Outlet,
  resolvePath,
  useLocation,
  useNavigate,
  useResolvedPath,
} from 'react-router-dom';
import {
  Flex,
  FlexItem,
  PageGroup,
  PageSection,
  PageSectionVariants,
  Tab,
  Tabs,
  TabTitleText,
  Text,
  TextContent,
} from '@patternfly/react-core';
import {
  Dropdown,
  DropdownGroup,
  DropdownItem,
  DropdownSeparator,
  DropdownToggle,
} from '@patternfly/react-core/deprecated';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import cx from 'classnames';
import { FULL_APPLICATION_TITLE } from '../../consts/labels';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { HttpError } from '../../k8s/error';
import BreadCrumbs from '../../shared/components/breadcrumbs/BreadCrumbs';
import ErrorEmptyState from '../../shared/components/empty-state/ErrorEmptyState';
import { Action, DetailsPageTabProps } from './types';

import './DetailsPage.scss';

type DetailsPageProps = {
  title: React.ReactNode;
  headTitle: string;
  preComponent?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: ({ name: string; path: string } | React.ReactElement)[];
  actions?: Action[];
  tabs: DetailsPageTabProps[];
  baseURL: string;
  onTabSelect?: (selectedTabKey: string) => void;
};

const DetailsPage: React.FC<React.PropsWithChildren<DetailsPageProps>> = ({
  title,
  headTitle,
  preComponent = null,
  footer,
  description,
  breadcrumbs,
  actions = [],
  tabs = [],
  baseURL,
  onTabSelect,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const resolveBase = useResolvedPath('.');
  const basePath = baseURL ?? resolveBase.pathname;
  const currentTab = tabs.find(
    (t) => !!matchPath(resolvePath(t.key, basePath).pathname, location.pathname),
  )?.key;

  const activeTabKey = React.useMemo(() => currentTab || tabs?.[0]?.key, [currentTab, tabs]);
  const navigate = useNavigate();
  const setActiveTab = React.useCallback(
    (newTab: string) => {
      if (activeTabKey !== newTab) {
        navigate(`${basePath}${newTab ? `/${newTab}` : ''}`);
      }
    },
    [activeTabKey, navigate, basePath],
  );

  const dropdownItems = React.useMemo(
    () =>
      actions?.reduce((acc, action) => {
        const { type, key, label, isDisabled, disabledTooltip, component, ...props } = action;
        if (action.hidden) {
          return acc;
        }
        if (type === 'separator') {
          acc.push(<DropdownSeparator key={key} />);
          if (label) {
            acc.push(<DropdownGroup key={`${key}-group`} label={label} />);
          }
          return acc;
        }
        if (type === 'section-label') {
          acc.push(<DropdownGroup key={`${key}-group`} label={label} data-test={key} />);
          return acc;
        }
        if (isDisabled && disabledTooltip) {
          acc.push(
            <DropdownItem
              key={key}
              data-test={key}
              {...props}
              tooltip={disabledTooltip}
              isAriaDisabled
            >
              {label}
            </DropdownItem>,
          );
        } else {
          acc.push(
            <DropdownItem
              key={key}
              data-test={key}
              isDisabled={isDisabled}
              component={!isDisabled ? component : 'a'}
              {...props}
            >
              {label}
            </DropdownItem>,
          );
        }
        return acc;
      }, [] as React.ReactNode[]),
    [actions],
  );

  const tabComponents = tabs?.map(({ key, label, isFilled = true, ...rest }) => {
    return (
      <Tab
        data-test={`details__tabItem ${label.toLocaleLowerCase().replace(/\s/g, '')}`}
        key={key}
        eventKey={key}
        title={<TabTitleText>{label}</TabTitleText>}
        className={cx('app-details__tabs__tabItem', { isFilled })}
        {...rest}
      >
        <Outlet />
      </Tab>
    );
  });

  const renderTitle = () => {
    if (typeof title === 'string') {
      return (
        <Text component="h1" data-test="details__title">
          {title}
        </Text>
      );
    }
    return title;
  };

  const activeTab: DetailsPageTabProps = React.useMemo(
    () => tabs?.find((t) => (t.partial ? activeTabKey.startsWith(t.key) : t.key === activeTabKey)),
    [activeTabKey, tabs],
  );

  useDocumentTitle(`${headTitle} - ${activeTab.label} | ${FULL_APPLICATION_TITLE}`);

  if (!activeTab) {
    return <ErrorEmptyState httpError={HttpError.fromCode(404)} />;
  }

  return (
    <PageGroup data-test="details" className="app-details">
      <PageSection type="breadcrumb">
        {breadcrumbs && <BreadCrumbs data-test="details__breadcrumbs" breadcrumbs={breadcrumbs} />}
        <Flex style={{ paddingTop: 'var(--pf-v5-global--spacer--lg)' }}>
          <FlexItem>
            <TextContent>
              {renderTitle()}
              {description && <Text component="p">{description}</Text>}
            </TextContent>
          </FlexItem>
          {actions?.length ? (
            <FlexItem align={{ default: 'alignRight' }}>
              <Dropdown
                data-test="details__actions"
                position="right"
                toggle={
                  <DropdownToggle
                    onToggle={() => setIsOpen(!isOpen)}
                    toggleIndicator={CaretDownIcon}
                    toggleVariant="primary"
                  >
                    Actions
                  </DropdownToggle>
                }
                onSelect={() => setIsOpen(!isOpen)}
                isOpen={isOpen}
                dropdownItems={dropdownItems}
              />
            </FlexItem>
          ) : null}
        </Flex>
      </PageSection>
      {preComponent}
      {tabs?.length && (
        <PageSection className="app-details__tabs" isFilled variant={PageSectionVariants.light}>
          <Tabs
            data-test="app-details__tabs"
            onSelect={(_, k: string) => {
              setActiveTab(k);
              onTabSelect && onTabSelect(k);
            }}
            mountOnEnter
            unmountOnExit
            activeKey={activeTab.key}
          >
            {tabComponents}
          </Tabs>
        </PageSection>
      )}
      {footer && (
        <PageSection variant={PageSectionVariants.light} isFilled={false}>
          {footer}
        </PageSection>
      )}
    </PageGroup>
  );
};

export default DetailsPage;
