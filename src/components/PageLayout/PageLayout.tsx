import * as React from 'react';
import {
  Flex,
  FlexItem,
  PageBreadcrumb,
  PageGroup,
  PageSection,
  Content,
} from '@patternfly/react-core';
import ActionMenu from '../../shared/components/action-menu/ActionMenu';
import { Action, ActionMenuVariant } from '../../shared/components/action-menu/types';
import BreadCrumbs from '../../shared/components/breadcrumbs/BreadCrumbs';

type PageLayoutProps = {
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  description?: React.ReactNode;
  breadcrumbs?: ({ name: string; path: string } | React.ReactElement)[];
  actions?: Action[];
  customActions?: React.ReactNode;
};

const PageLayout: React.FC<React.PropsWithChildren<PageLayoutProps>> = ({
  title,
  children,
  footer,
  description,
  breadcrumbs,
  actions,
  customActions,
}) => {
  return (
    <>
      <PageGroup isFilled={false}>
        {breadcrumbs && (
          <PageBreadcrumb hasBodyWrapper={false}>
            {<BreadCrumbs breadcrumbs={breadcrumbs} />}
          </PageBreadcrumb>
        )}
        <PageSection hasBodyWrapper={false}>
          <Flex>
            <FlexItem>
              <Content>
                <Content component="h1">{title}</Content>
                {description && <Content component="p">{description}</Content>}
              </Content>
            </FlexItem>
            {actions && (
              <FlexItem align={{ default: 'alignRight' }}>
                <ActionMenu variant={ActionMenuVariant.PRIMARY} actions={actions} />
              </FlexItem>
            )}
            {customActions && (
              <FlexItem align={{ default: 'alignRight' }}>{customActions}</FlexItem>
            )}
          </Flex>
        </PageSection>
      </PageGroup>
      {children}
      {footer && (
        <PageSection hasBodyWrapper={false} isFilled={false}>
          {footer}
        </PageSection>
      )}
    </>
  );
};

export default PageLayout;
