import * as React from 'react';
import { NavLink } from 'react-router-dom';
import { Button, Flex, FlexItem, NavItem } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { parseAsString, useQueryState } from 'nuqs';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { createSavedViewDeleteModal } from './SavedViewDeleteModal';
import { createSavedViewRenameModal } from './SavedViewRenameModal';
import { SavedView, SavedViewsConfig } from './types';
import { useSavedViews } from './useSavedViews';

import './SavedViewNavItems.scss';

type SavedViewNavItemsProps = {
  config: SavedViewsConfig;
};

export const SavedViewNavItems: React.FC<SavedViewNavItemsProps> = ({ config }) => {
  const { views, renameView, deleteView } = useSavedViews(config);
  const showModal = useModalLauncher();
  const [activeViewSlug] = useQueryState('view', parseAsString);

  const buildViewHref = (view: SavedView): string => {
    const basePath = config.routePath;
    const params = new URLSearchParams(view.searchParams);
    params.set('view', view.slug);
    return `${basePath}?${params.toString()}`;
  };

  if (views.length === 0) {
    return null;
  }

  return (
    <>
      {views.map((view) => {
        const handleRename = () => {
          showModal(
            createSavedViewRenameModal({
              currentLabel: view.label,
              onRename: (newLabel: string) => renameView(view.slug, newLabel),
            }),
          );
        };

        const handleDelete = () => {
          showModal(
            createSavedViewDeleteModal({
              viewLabel: view.label,
              onDelete: () => deleteView(view.slug),
            }),
          );
        };

        const isActive = activeViewSlug === view.slug;
        const href = buildViewHref(view);

        return (
          <NavItem key={view.slug} isActive={isActive}>
            <NavLink to={href} style={{ display: 'block' }}>
              <Flex
                justifyContent={{ default: 'justifyContentSpaceBetween' }}
                alignItems={{ default: 'alignItemsCenter' }}
                flexWrap={{ default: 'nowrap' }}
                data-test={`saved-view-nav-${view.slug}`}
              >
                <FlexItem>{view.label}</FlexItem>
                <Flex gap={{ default: 'gapMd' }}>
                  <Button
                    className="saved-view-nav-items__button saved-view-nav-items__button--rename"
                    variant="plain"
                    onClick={handleRename}
                    data-test={`saved-view-rename-${view.slug}`}
                  >
                    <PencilAltIcon />
                  </Button>
                  <Button
                    className="saved-view-nav-items__button saved-view-nav-items__button--delete"
                    variant="plain"
                    onClick={handleDelete}
                    data-test={`saved-view-delete-${view.slug}`}
                  >
                    <TrashIcon />
                  </Button>
                </Flex>
              </Flex>
            </NavLink>
          </NavItem>
        );
      })}
    </>
  );
};
