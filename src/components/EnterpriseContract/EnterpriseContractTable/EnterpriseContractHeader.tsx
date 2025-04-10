import { ThProps } from '@patternfly/react-table';

export const EnterpriseContractTableColumnClasses = {
  expand: `pf-m-width-10`,
  rules: 'pf-m-width-30 wrap-column',
  status: 'pf-m-width-10',
  message: 'pf-m-width-30 wrap-column',
  component: 'pf-m-width-20',
};

export const EnterpriseContractHeader = (getSortParams: (index: number) => ThProps['sort']) => {
  return [
    {
      title: '',
      props: {
        className: EnterpriseContractTableColumnClasses.expand,
        style: {
          paddingLeft: '5%',
        },
      },
    },
    {
      title: 'Rules',
      props: { className: EnterpriseContractTableColumnClasses.rules },
      sort: getSortParams(1),
    },
    {
      title: 'Status',
      props: { className: EnterpriseContractTableColumnClasses.status },
      sort: getSortParams(2),
    },
    {
      title: 'Message',
      props: { className: EnterpriseContractTableColumnClasses.message },
    },
    {
      title: 'Component',
      props: { className: EnterpriseContractTableColumnClasses.component },
      sort: getSortParams(4),
    },
  ];
};
