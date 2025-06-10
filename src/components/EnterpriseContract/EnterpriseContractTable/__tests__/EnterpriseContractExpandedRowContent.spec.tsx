import { render, screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ENTERPRISE_CONTRACT_STATUS } from '../../types';
import { EnterpriseContractExpandedRowContent } from '../EnterpriseContractExpandedRowContent';

const rowContent = {
  title: 'dummyTitle',
  status: ENTERPRISE_CONTRACT_STATUS.violations,
  component: 'component-1',
  description: 'dummy description',
  msg: 'Fail',
  timestamp: '2022-01-01T00:00:00Z',
  collection: ['abcd', 'efg'],
};

const invalidContent = {
  title: null,
  status: null,
  component: null,
  description: null,
  msg: null,
  timestamp: null,
  collection: null,
};

describe('EnterpriseContractExpandedRowContent', () => {
  mockUseNamespaceHook('test-ns');

  it('should render the component', () => {
    render(<EnterpriseContractExpandedRowContent obj={rowContent} />);
    screen.getByText('Effective from');
    screen.getByText('Collection');
    screen.getByText('abcd, efg');
    screen.getByText('Rule Description');
    screen.getByText('dummy description');
  });

  it('should not render the component', () => {
    render(<EnterpriseContractExpandedRowContent obj={invalidContent} />);
    expect(screen.queryByText('Effective from')).not.toBeInTheDocument();
    expect(screen.queryByText('Collection')).not.toBeInTheDocument();
  });
});
