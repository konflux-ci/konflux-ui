import React from 'react';
import { ThProps } from '@patternfly/react-table';

export const namespaceTableColumnClasses = {
  name: 'pf-m-width-35',
  visibility: 'pf-m-width-25',
  applications: 'pf-m-width-25',
  kebab: 'pf-m-width-15 pf-c-table__action',
};
interface NamespaceListHeaderOptions {
  showActions?: boolean;
}

export const createNamespaceListHeader = ({
  showActions = true,
}: NamespaceListHeaderOptions = {}) => {
  return () => {
    const columns: Array<{ title: string | React.ReactNode; props: ThProps }> = [
      {
        title: 'Name',
        props: { className: namespaceTableColumnClasses.name },
      },
      {
        title: 'Visibility',
        props: { className: namespaceTableColumnClasses.visibility },
      },
      {
        title: 'Applications',
        props: { className: namespaceTableColumnClasses.applications },
      },
    ];

    if (showActions) {
      columns.push({
        title: React.createElement('span', { className: 'pf-u-screen-reader' }, 'Actions'),
        props: {
          className: namespaceTableColumnClasses.kebab,
          'aria-label': 'Actions',
        } as ThProps,
      });
    }

    return columns;
  };
};

// Default header with actions enabled for backward compatibility
export const NamespaceListHeader = createNamespaceListHeader();
