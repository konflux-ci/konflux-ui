export const snapshotsTableColumnClasses = {
  name: 'pf-m-width-25',
  createdAt: 'pf-m-width-25',
  components: 'pf-m-width-15',
  triggerCommit: 'pf-m-width-20',
  status: 'pf-m-width-15',
};

const SnapshotsListHeader = () => {
  return [
    {
      title: 'Name',
      props: { className: snapshotsTableColumnClasses.name },
    },
    {
      title: 'Created at',
      props: { className: snapshotsTableColumnClasses.createdAt },
    },
    {
      title: 'Components',
      props: { className: snapshotsTableColumnClasses.components },
    },
    {
      title: 'Trigger commit',
      props: { className: snapshotsTableColumnClasses.triggerCommit },
    },
    {
      title: 'Status',
      props: { className: snapshotsTableColumnClasses.status },
    },
  ];
};

export default SnapshotsListHeader;
