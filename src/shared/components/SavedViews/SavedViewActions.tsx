import * as React from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { parseAsString, useQueryState } from 'nuqs';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { createSavedViewDeleteModal } from './SavedViewDeleteModal';
import { createSavedViewRenameModal } from './SavedViewRenameModal';
import { createSavedViewSaveModal } from './SavedViewSaveModal';
import { SavedView } from './types';
import { useSavedViews } from './useSavedViews';

type SavedViewActionsProps = {
  resourceKey: string;
  columnKeyPrefix: string;
  currentColumnStateKey: string;
  isFiltered: boolean;
  activeSavedView: SavedView | undefined;
};

export const SavedViewActions: React.FC<SavedViewActionsProps> = ({
  resourceKey,
  columnKeyPrefix,
  currentColumnStateKey,
  isFiltered,
  activeSavedView,
}) => {
  const { saveView, deleteView, renameView, updateView } = useSavedViews({
    resourceKey,
    columnKeyPrefix,
    routePath: '',
  });
  const [, setViewParam] = useQueryState('view', parseAsString);
  const showModal = useModalLauncher();
  const [isOpen, setIsOpen] = React.useState(false);

  const isDisabled = !isFiltered && !activeSavedView;

  const getSearchParams = (): string => {
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('view');
    return currentParams.toString();
  };

  const hasParamsChanged = activeSavedView
    ? getSearchParams() !== activeSavedView.searchParams
    : false;

  const handleSaveView = () => {
    setIsOpen(false);
    showModal(
      createSavedViewSaveModal({
        onSave: (name: string, slug: string | undefined) => {
          const savedSlug = saveView({
            slug,
            label: name,
            searchParams: getSearchParams(),
            currentColumnStateKey,
          });
          void setViewParam(savedSlug);
        },
      }),
    );
  };

  const handleEditView = () => {
    setIsOpen(false);
    if (activeSavedView) {
      showModal(
        createSavedViewRenameModal({
          currentLabel: activeSavedView.label,
          onRename: (newLabel: string) => {
            renameView(activeSavedView.slug, newLabel);
          },
        }),
      );
    }
  };

  const handleUpdateView = () => {
    setIsOpen(false);
    if (activeSavedView) {
      updateView(activeSavedView.slug, {
        searchParams: getSearchParams(),
        currentColumnStateKey,
      });
    }
  };

  const handleDeleteView = () => {
    setIsOpen(false);
    if (activeSavedView) {
      showModal(
        createSavedViewDeleteModal({
          viewLabel: activeSavedView.label,
          onDelete: () => {
            deleteView(activeSavedView.slug);
          },
        }),
      );
    }
  };

  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle
      ref={toggleRef}
      variant="primary"
      onClick={onToggleClick}
      isExpanded={isOpen}
      isDisabled={isDisabled}
      data-test="saved-view-actions-toggle"
    >
      Actions
    </MenuToggle>
  );

  return (
    <Dropdown
      isOpen={isOpen}
      popperProps={{ position: 'right' }}
      onOpenChange={setIsOpen}
      toggle={toggle}
      data-test="saved-view-actions-dropdown"
    >
      <DropdownList>
        {!activeSavedView && isFiltered && (
          <DropdownItem key="save" onClick={handleSaveView} data-test="saved-view-action-save">
            Save view
          </DropdownItem>
        )}
        {activeSavedView && hasParamsChanged && (
          <DropdownItem
            key="update"
            onClick={handleUpdateView}
            data-test="saved-view-action-update"
          >
            Update view with new filters
          </DropdownItem>
        )}
        {activeSavedView && (
          <DropdownItem key="edit" onClick={handleEditView} data-test="saved-view-action-edit">
            Edit view
          </DropdownItem>
        )}
        {activeSavedView && (
          <DropdownItem
            key="delete"
            onClick={handleDeleteView}
            data-test="saved-view-action-delete"
            isDanger
          >
            Delete
          </DropdownItem>
        )}
      </DropdownList>
    </Dropdown>
  );
};
