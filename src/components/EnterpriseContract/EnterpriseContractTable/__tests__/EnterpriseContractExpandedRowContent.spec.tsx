import { render, screen } from '@testing-library/react';
import { UIEnterpriseContractData } from '~/types';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ENTERPRISE_CONTRACT_STATUS } from '../../types';
import { EnterpriseContractExpandedRowContent } from '../EnterpriseContractExpandedRowContent';

const dummySuccessRowData = {
  title: 'dummyTitle',
  status: ENTERPRISE_CONTRACT_STATUS.successes,
  component: 'component-1',
  description: 'dummy description',
} as UIEnterpriseContractData;

const dumpFailRowData = {
  title: 'dummyTitle',
  status: ENTERPRISE_CONTRACT_STATUS.violations,
  component: 'component-1',
  description: 'dummy description',
  msg: 'Fail',
  timestamp: '2022-01-01T00:00:00Z',
  collection: ['abcd', 'efg'],
};

const cusmtomDummyData = {
  sortedECResult: [dummySuccessRowData, dumpFailRowData],
};

describe('EnterpriseContractExpandedRowContent', () => {
  mockUseNamespaceHook('test-ns');

  it('should render the component', () => {
    render(
      <EnterpriseContractExpandedRowContent
        customData={cusmtomDummyData}
        obj={dumpFailRowData}
        expandedRowIndex={1}
      />,
    );
    screen.getByText('Effective from');
    screen.getByText('Collection');
    screen.getByText('abcd, efg');
    screen.getByText('Rule Description');
    screen.getByText('dummy description');
  });

  it('should not render the component', () => {
    render(
      <EnterpriseContractExpandedRowContent
        customData={cusmtomDummyData}
        obj={dumpFailRowData}
        expandedRowIndex={0}
      />,
    );
    expect(screen.queryByText('Effective from')).not.toBeInTheDocument();
    expect(screen.queryByText('Collection')).not.toBeInTheDocument();
  });
});
