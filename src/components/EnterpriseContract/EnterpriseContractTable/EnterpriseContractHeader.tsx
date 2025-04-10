import { ThProps } from '@patternfly/react-table';

export const ECTableColumnClasses = {
  expand: 'pf-m-width-10',
  rules: 'pf-m-width-30',
  status: 'pf-m-width-10',
  message: 'pf-m-width-30',
  component: 'pf-m-width-20',
};

const EnterpriseContractHeader = (getSortParams: (index: number) => ThProps['sort']) => {
  return [
    { title: '', props: { className: ECTableColumnClasses.expand } },
    {
      title: 'Rules',
      props: { className: ECTableColumnClasses.rules },
      sort: getSortParams(1),
    },
    {
      title: 'Status',
      props: { className: ECTableColumnClasses.status },
      sort: getSortParams(2),
    },
    {
      title: 'Message',
      props: { className: ECTableColumnClasses.message },
    },
    {
      title: 'Component',
      props: { className: ECTableColumnClasses.component },
      sort: getSortParams(4),
    },
  ];
};

export default EnterpriseContractHeader;
