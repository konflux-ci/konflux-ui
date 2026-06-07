import * as React from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownList, MenuToggle, NavItem } from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { createSavedViewDeleteModal } from './SavedViewDeleteModal';
import { createSavedViewRenameModal } from './SavedViewRenameModal';
import { SavedView, SavedViewsConfig } from './types';
import { useSavedViews } from './useSavedViews';

type SavedViewNavItemsProps = {
  config: SavedViewsConfig;
  namespace: string;
};

export const SavedViewNavItems: React.FC<SavedViewNavItemsProps> = ({ config, namespace }) => {
  const { views, renameView, deleteView } = useSavedViews(config);
  const showModal = useModalLauncher();
  const [searchParams] = useSearchParams();
  const [openKebab, setOpenKebab] = React.useState<string | null>(null);

  const activeViewSlug = searchParams.get('view');

  const buildViewHref = (view: SavedView): string => {
    const basePath = config.routePath.replace(':workspaceName', namespace).replace(/^\/+/, '');
    const params = new URLSearchParams(view.searchParams);
    params.set('view', view.slug);
    return `/${basePath}?${params.toString()}`;
  };

  if (views.length === 0) {
    return null;
  }

  return (
    <>
      {views.map((view) => {
        const handleRename = () => {
          setOpenKebab(null);
          showModal(
            createSavedViewRenameModal({
              currentLabel: view.label,
              onRename: (newLabel: string) => renameView(view.slug, newLabel),
            }),
          );
        };

        const handleDelete = () => {
          setOpenKebab(null);
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
            <div className="saved-view-nav-item" data-test={`saved-view-nav-${view.slug}`}>
              <NavLink to={href}>{view.label}</NavLink>
              <Dropdown
                isOpen={openKebab === view.slug}
                onOpenChange={(isOpen) => setOpenKebab(isOpen ? view.slug : null)}
                toggle={(toggleRef) => (
                  <MenuToggle
                    ref={toggleRef as React.Ref<HTMLButtonElement>}
                    variant="plain"
                    onClick={() => setOpenKebab(openKebab === view.slug ? null : view.slug)}
                    isExpanded={openKebab === view.slug}
                    data-test={`saved-view-kebab-${view.slug}`}
                  >
                    <EllipsisVIcon />
                  </MenuToggle>
                )}
                popperProps={{ position: 'right' }}
              >
                <DropdownList>
                  <DropdownItem onClick={handleRename} data-test="saved-view-rename-action">
                    Rename
                  </DropdownItem>
                  <DropdownItem onClick={handleDelete} data-test="saved-view-delete-action">
                    Delete
                  </DropdownItem>
                </DropdownList>
              </Dropdown>
            </div>
          </NavItem>
        );
      })}
    </>
  );
};
