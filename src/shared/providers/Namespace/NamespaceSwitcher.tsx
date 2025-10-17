import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MenuToggle } from '@patternfly/react-core';
import { useQuery } from '@tanstack/react-query';
import { ContextMenuItem, ContextSwitcher } from '../../components';
import { NAMESPACE_VISIBILITY_LABEL } from '../../const';
import { useNamespace } from './useNamespaceInfo';
import { createNamespaceQueryOptions } from './utils';

export const NamespaceSwitcher: React.FC<
  React.PropsWithChildren<{ selectedNamespace?: string }>
> = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { data: namespaces } = useQuery(createNamespaceQueryOptions());
  const namespace = useNamespace();

  const menuItems = React.useMemo(
    () =>
      namespaces?.map((app) => ({
        key: app.metadata.name,
        name: app.metadata.name,
        visibility: app.metadata.labels?.[NAMESPACE_VISIBILITY_LABEL] ?? undefined,
      })) || [],
    [namespaces],
  );
  const selectedItem =
    namespaces?.find((item) => item.metadata.name === namespace) || namespaces?.[0];

  const onSelect = (item: ContextMenuItem) => {
    // switch to new workspace but keep the first segment of the URL
    navigate(pathname.replace(/\/ns\/[-a-z0-9]+\/?([-a-z0-9]*).*/, `/ns/${item.name}/$1`));
  };

  return namespaces?.length > 0 ? (
    <ContextSwitcher
      resourceType="namespace"
      menuItems={menuItems}
      selectedItem={{ key: selectedItem?.metadata.name, name: selectedItem?.metadata.name }}
      onSelect={onSelect}
      footer={<></>}
      toggle={(props) => (
        <MenuToggle style={{ paddingInlineStart: 0 }} variant="plainText" {...props}>
          Namespace: {namespace}
        </MenuToggle>
      )}
    />
  ) : null;
};
