import { createTableHeaders } from '../../../shared/components/table/utils';

export const releaseArtifactsTableColumnClasses = {
  componentName: 'pf-m-width-30',
  url: 'pf-m-width-45 wrap-column',
  arches: 'pf-m-width-20',
};

export const enum SortableHeaders {
  componentName,
  url,
  arches,
}

const releaseArtifactsColumns = [
  {
    title: 'Component name',
    className: releaseArtifactsTableColumnClasses.componentName,
    sortable: true,
  },
  {
    title: 'URL',
    className: releaseArtifactsTableColumnClasses.url,
    sortable: true,
  },
  {
    title: 'Arches',
    className: releaseArtifactsTableColumnClasses.arches,
    sortable: true,
  },
];

export default createTableHeaders(releaseArtifactsColumns);
