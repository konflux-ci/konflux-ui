import { ReleasePlanColumnKeys } from '../../../consts/release';

export const releasesPlanTableColumnClasses = {
  name: 'pf-m-width-20 wrap-column',
  application: 'pf-m-width-15',
  target: 'pf-m-width-15',
  autoRelease: 'pf-m-hidden pf-m-width-10 pf-m-visible-on-xl',
  standingAttribution: 'pf-m-hidden pf-m-width-15 pf-m-visible-on-xl',
  status: 'pf-m-hidden pf-m-width-15 pf-m-visible-on-xl',
  rpa: 'pf-m-hidden pf-m-width-15 pf-m-visible-on-xl',
  kebab: 'pf-c-table__action',
};

export const getDynamicReleasePlanColumnClasses = (visibleColumns: Set<ReleasePlanColumnKeys>) => {
  const totalVisibleColumns = visibleColumns.size;
  const isSmallTable = totalVisibleColumns <= 4;

  return {
    name: 'pf-m-width-20 wrap-column',
    application: isSmallTable ? 'pf-m-width-20' : 'pf-m-width-15',
    target: isSmallTable ? 'pf-m-width-20' : 'pf-m-width-15',
    autoRelease: isSmallTable ? 'pf-m-width-15' : 'pf-m-hidden pf-m-width-10 pf-m-visible-on-xl',
    standingAttribution: isSmallTable
      ? 'pf-m-width-20'
      : 'pf-m-hidden pf-m-width-15 pf-m-visible-on-xl',
    status: isSmallTable ? 'pf-m-width-15' : 'pf-m-hidden pf-m-width-15 pf-m-visible-on-xl',
    rpa: isSmallTable ? 'pf-m-width-20' : 'pf-m-hidden pf-m-width-15 pf-m-visible-on-xl',
    kebab: 'pf-c-table__action',
  };
};

const ReleasePlanListHeader = () => {
  return [
    {
      title: 'Name',
      props: { className: releasesPlanTableColumnClasses.name },
    },
    {
      title: 'Application',
      props: { className: releasesPlanTableColumnClasses.application },
    },
    {
      title: 'Target Namespace',
      props: { className: releasesPlanTableColumnClasses.target },
    },
    {
      title: 'Auto release',
      props: { className: releasesPlanTableColumnClasses.autoRelease },
    },
    {
      title: 'Standing attribution',
      props: { className: releasesPlanTableColumnClasses.standingAttribution },
    },
    {
      title: 'Status',
      props: { className: releasesPlanTableColumnClasses.status },
    },
    {
      title: 'Release plan admission',
      props: { className: releasesPlanTableColumnClasses.rpa },
    },
    {
      title: ' ',
      props: {
        className: releasesPlanTableColumnClasses.kebab,
      },
    },
  ];
};

// Dynamic header function that works with visible columns
export const getReleasePlanListHeader = (visibleColumns: Set<ReleasePlanColumnKeys>) => () => {
  const dynamicClasses = getDynamicReleasePlanColumnClasses(visibleColumns);
  const columns = [];

  if (visibleColumns.has('name')) {
    columns.push({
      title: 'Name',
      props: { className: dynamicClasses.name },
    });
  }

  if (visibleColumns.has('application')) {
    columns.push({
      title: 'Application',
      props: { className: dynamicClasses.application },
    });
  }

  if (visibleColumns.has('target')) {
    columns.push({
      title: 'Target Namespace',
      props: { className: dynamicClasses.target },
    });
  }

  if (visibleColumns.has('autoRelease')) {
    columns.push({
      title: 'Auto release',
      props: { className: dynamicClasses.autoRelease },
    });
  }

  if (visibleColumns.has('standingAttribution')) {
    columns.push({
      title: 'Standing attribution',
      props: { className: dynamicClasses.standingAttribution },
    });
  }

  if (visibleColumns.has('status')) {
    columns.push({
      title: 'Status',
      props: { className: dynamicClasses.status },
    });
  }

  if (visibleColumns.has('rpa')) {
    columns.push({
      title: 'Release plan admission',
      props: { className: dynamicClasses.rpa },
    });
  }

  // Always add the kebab column at the end
  columns.push({
    title: ' ',
    props: { className: dynamicClasses.kebab },
  });

  return columns;
};

export default ReleasePlanListHeader;
