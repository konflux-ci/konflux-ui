import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Level, LevelItem } from '@patternfly/react-core';
import { useApplications } from '../../../hooks/useApplications';
import { ApplicationModel, ComponentModel } from '../../../models';
import {
  APPLICATION_DETAILS_PATH,
  APPLICATION_LIST_PATH,
  IMPORT_PATH,
} from '../../../routes/paths';
import { ContextMenuItem, ContextSwitcher } from '../../../shared/components';
import { useNamespace } from '../../../shared/providers/Namespace';
import { useAccessReviewForModel } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';

export const ApplicationSwitcher: React.FC<
  React.PropsWithChildren<{ selectedApplication?: string }>
> = ({ selectedApplication }) => {
  const navigate = useNavigate();
  const namespace = useNamespace();
  const [canCreateApplication] = useAccessReviewForModel(ApplicationModel, 'create');
  const [canCreateComponent] = useAccessReviewForModel(ComponentModel, 'create');

  const [applications] = useApplications(namespace);

  const menuItems = React.useMemo(
    () =>
      applications?.map((app) => ({ key: app.metadata.name, name: app.spec.displayName })) || [],
    [applications],
  );

  const selectedItem = menuItems.find((item) => item.key === selectedApplication);

  const onSelect = (item: ContextMenuItem) => {
    selectedItem.key !== item.key &&
      navigate(
        APPLICATION_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName: item.key,
        }),
      );
  };

  return menuItems.length > 1 ? (
    <ContextSwitcher
      resourceType="application"
      menuItems={menuItems}
      selectedItem={selectedItem}
      onSelect={onSelect}
      footer={
        <Level>
          <LevelItem>
            <ButtonWithAccessTooltip
              variant="link"
              component={(props) => (
                <Link {...props} to={IMPORT_PATH.createPath({ workspaceName: namespace })} />
              )}
              isInline
              tooltip="You don't have access to create an application"
              isDisabled={!(canCreateApplication && canCreateComponent)}
              analytics={{
                link_name: 'create-application',
                namespace,
              }}
            >
              Create application
            </ButtonWithAccessTooltip>
          </LevelItem>
          <LevelItem>
            <Button
              variant="link"
              component={(props) => (
                <Link
                  {...props}
                  to={APPLICATION_LIST_PATH.createPath({ workspaceName: namespace })}
                />
              )}
              isInline
            >
              View applications list
            </Button>
          </LevelItem>
        </Level>
      }
    />
  ) : null;
};
