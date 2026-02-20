import { createTableHeaders } from '~/shared/components/table/utils';

export const versionTableColumnClasses = {
  name: 'pf-m-width-20',
  revision: 'pf-m-width-20',
  pipeline: 'pf-m-width-20',
};

export const enum SortableHeaders {
  name = 0,
  revision = 1,
}

const versionColumns = [
  { title: 'Version name', className: versionTableColumnClasses.name, sortable: true },
  { title: 'Git branch or tag', className: versionTableColumnClasses.revision, sortable: true },
  { title: 'Pipeline', className: versionTableColumnClasses.pipeline },
];

export default createTableHeaders(versionColumns);
