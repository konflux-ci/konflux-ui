import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Flex,
  FlexItem,
  Icon,
  PageGroup,
  PageSection,
  PageSectionVariants,
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
import { ArrowLeftIcon } from '@patternfly/react-icons/dist/esm/icons/arrow-left-icon';
import { CaretDownIcon } from '@patternfly/react-icons/dist/esm/icons/caret-down-icon';
import { css } from '@patternfly/react-styles';
import BreadCrumbs from '../../shared/components/breadcrumbs/BreadCrumbs';
import { TabsLayout } from '../TabsLayout/TabsLayout';
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
  baseURL?: string;
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
  const navigate = useNavigate();
  const { state } = useLocation();
  const showBackLink = state?.showBackButton || false;
  const [isOpen, setIsOpen] = React.useState(false);

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

  const tabComponents = tabs?.map(({ isFilled, className, ...rest }) => {
    return { ...rest, className: css(className, { 'app-details__tabs__tabItem': true, isFilled }) };
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

  return (
    <PageGroup data-test="details" className="app-details">
      <PageSection type="breadcrumb">
        {!showBackLink && breadcrumbs && (
          <BreadCrumbs data-test="details__breadcrumbs" breadcrumbs={breadcrumbs} />
        )}
        {showBackLink ? (
          <Button onClick={() => navigate(-1)} variant="link" isInline>
            <Icon>
              <ArrowLeftIcon style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }} />
            </Icon>
            {'Back to release details'}
          </Button>
        ) : (
          ''
        )}
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
          <TabsLayout
            id="app-details"
            onTabSelect={onTabSelect}
            tabs={tabComponents}
            headTitle={headTitle}
            baseURL={baseURL}
          />
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
