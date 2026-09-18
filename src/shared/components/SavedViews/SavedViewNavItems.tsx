import * as React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Button,
  Flex,
  FlexItem,
  NavGroup,
  NavItem,
  NavItemSeparator,
} from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import { parseAsString, useQueryState } from 'nuqs';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { useNamespace } from '~/shared/providers/Namespace';
import { createSavedViewDeleteModal } from './SavedViewDeleteModal';
import { SavedView, SavedViewsConfig } from './types';
import { useSavedViews } from './useSavedViews';

import './SavedViewNavItems.scss';

type SavedViewNavItemsProps = {
  config: SavedViewsConfig;
};

const SavedViewNavItem: React.FC<{
  view: SavedView;
  isActive: boolean;
  href: string;
  onDelete: () => void;
}> = ({ view, isActive, href, onDelete }) => (
  <NavItem key={view.slug} isActive={isActive}>
    <NavLink to={href} style={{ display: 'block' }}>
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsCenter' }}
        flexWrap={{ default: 'nowrap' }}
        data-test={`saved-view-nav-${view.slug}`}
      >
        <FlexItem>{view.label}</FlexItem>
        <Button
          className="saved-view-nav-items__button saved-view-nav-items__button--delete"
          variant="link"
          isInline
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete();
          }}
          data-test={`saved-view-delete-${view.slug}`}
        >
          <TrashIcon />
        </Button>
      </Flex>
    </NavLink>
  </NavItem>
);

export const SavedViewNavItems: React.FC<SavedViewNavItemsProps> = ({ config }) => {
  const currentNamespace = useNamespace();
  const { views, deleteView } = useSavedViews(config, currentNamespace);
  const showModal = useModalLauncher();
  const [activeViewSlug] = useQueryState('view', parseAsString);

  const buildViewHref = (view: SavedView): string => {
    const basePath = config.routePathBuilder(view.namespace);
    const params = new URLSearchParams(view.searchParams);
    params.set('view', view.slug);
    return `${basePath}?${params.toString()}`;
  };

  const handleDelete = (view: SavedView) => {
    showModal(
      createSavedViewDeleteModal({
        viewLabel: view.label,
        onDelete: () => deleteView(view.slug),
      }),
    );
  };

  if (views.length === 0) {
    return null;
  }

  // Group views by namespace
  const viewsByNamespace: Record<string, SavedView[]> = {};
  for (const view of views) {
    const ns = view.namespace;
    if (!viewsByNamespace[ns]) {
      viewsByNamespace[ns] = [];
    }
    viewsByNamespace[ns].push(view);
  }

  const namespaces = Object.keys(viewsByNamespace);
  const isMultiNamespace = namespaces.length > 1;

  // Single namespace: flat list, no group headers
  if (!isMultiNamespace) {
    return (
      <>
        {views.map((view) => (
          <SavedViewNavItem
            key={view.slug}
            view={view}
            isActive={activeViewSlug === view.slug}
            href={buildViewHref(view)}
            onDelete={() => handleDelete(view)}
          />
        ))}
      </>
    );
  }

  // Multiple namespaces: NavGroup per namespace with separators
  return (
    <>
      {namespaces.map((ns, idx) => (
        <React.Fragment key={ns}>
          {idx > 0 && <NavItemSeparator />}
          <NavGroup title={ns} data-test={`saved-view-group-${ns}`}>
            {viewsByNamespace[ns].map((view) => (
              <SavedViewNavItem
                key={view.slug}
                view={view}
                isActive={activeViewSlug === view.slug}
                href={buildViewHref(view)}
                onDelete={() => handleDelete(view)}
              />
            ))}
          </NavGroup>
        </React.Fragment>
      ))}
    </>
  );
};
