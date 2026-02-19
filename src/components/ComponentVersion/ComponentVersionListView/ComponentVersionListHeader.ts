import { createTableHeaders } from '~/shared/components/table/utils';

export const versionTableColumnClasses = {
  name: 'pf-m-width-20',
  description: 'pf-m-width-25',
  revision: 'pf-m-width-20',
  pipeline: 'pf-m-width-20',
};

export const enum SortableHeaders {
  name = 0,
  revision = 2,
  pipeline = 3,
}

const versionColumns = [
  { title: 'Version name', className: versionTableColumnClasses.name, sortable: true },
  { title: 'Description', className: versionTableColumnClasses.description },
  { title: 'Git branch or tag', className: versionTableColumnClasses.revision, sortable: true },
  { title: 'Pipeline', className: versionTableColumnClasses.pipeline, sortable: true },
];

export default createTableHeaders(versionColumns);
