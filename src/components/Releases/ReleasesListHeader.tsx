import { SortByDirection, ThProps } from '@patternfly/react-table';
import { HeaderFunc } from '../../shared/components/table/Table';

export const releasesTableColumnClasses = {
  name: 'pf-m-width-30 pf-m-width-20-on-xl wrap-column',
  created: 'pf-m-width-20 pf-m-width-20-on-xl',
  duration: 'pf-m-hidden pf-m-width-20 pf-m-visible-on-xl',
  status: 'pf-m-width-20',
  releasePlan: 'pf-m-width-25',
  releaseSnapshot: 'pf-m-hidden pf-m-width-25 pf-m-visible-on-xl',
  kebab: 'pf-v5-c-table__action',
};

type CreateHeader = (
  activeIndex: number,
  activeDirection: SortByDirection,
  onSort: ThProps['sort']['onSort'],
) => HeaderFunc;

export const enum SortableHeaders {
  name,
  created,
}

const getReleasesListHeader: CreateHeader = (activeIndex, activeDirection, onSort) => () => {
  const getSortParams = (columnIndex: number) => ({
    columnIndex,
    sortBy: { index: activeIndex, direction: activeDirection },
    onSort,
  });

  return [
    {
      title: 'Name',
      props: {
        className: releasesTableColumnClasses.name,
        sort: getSortParams(SortableHeaders.name),
      },
    },
    {
      title: 'Created',
      props: {
        className: releasesTableColumnClasses.created,
        sort: getSortParams(SortableHeaders.created),
      },
    },
    {
      title: 'Duration',
      props: { className: releasesTableColumnClasses.duration },
    },
    {
      title: 'Status',
      props: { className: releasesTableColumnClasses.status },
    },
    {
      title: 'Release Plan',
      props: { className: releasesTableColumnClasses.releasePlan },
    },
    {
      title: 'Release Snapshot',
      props: { className: releasesTableColumnClasses.releaseSnapshot },
    },
    {
      title: ' ',
      props: { className: releasesTableColumnClasses.kebab },
    },
  ];
};

export default getReleasesListHeader;
