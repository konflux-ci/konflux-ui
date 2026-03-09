import { render, screen } from '@testing-library/react';
import { CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ConformaExpandedRowContent } from '../ConformaExpandedRowContent';

const rowContent = {
  title: 'dummyTitle',
  status: CONFORMA_RESULT_STATUS.violations,
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

describe('ConformaExpandedRowContent', () => {
  mockUseNamespaceHook('test-ns');

  it('should render the component', () => {
    render(<ConformaExpandedRowContent obj={rowContent} />);
    screen.getByText('Effective from');
    screen.getByText('Collection');
    screen.getByText('abcd, efg');
    screen.getByText('Rule Description');
    screen.getByText('dummy description');
  });

  it('should not render the component', () => {
    render(<ConformaExpandedRowContent obj={invalidContent} />);
    expect(screen.queryByText('Effective from')).not.toBeInTheDocument();
    expect(screen.queryByText('Collection')).not.toBeInTheDocument();
  });
});
