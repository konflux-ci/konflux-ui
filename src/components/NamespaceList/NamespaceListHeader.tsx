import React from 'react';
import { ThProps } from '@patternfly/react-table';

export const namespaceTableColumnClasses = {
  name: 'pf-m-width-35',
  visibility: 'pf-m-width-25',
  applications: 'pf-m-width-25',
  kebab: 'pf-m-width-15 pf-c-table__action',
};

export const createNamespaceListHeader = () => {
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

    return columns;
  };
};

export const NamespaceListHeader = createNamespaceListHeader();
