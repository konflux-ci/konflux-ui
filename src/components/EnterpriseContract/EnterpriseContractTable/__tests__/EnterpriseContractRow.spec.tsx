import { fireEvent, render, screen } from '@testing-library/react';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ENTERPRISE_CONTRACT_STATUS } from '../../types';
import { EnterpriseContractRow } from '../EnterpriseContractRow';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    Link: (props) => (
      <a href={props.to} data-test={props['data-test']}>
        {props.children}
      </a>
    ),
    useParams: jest.fn(() => ({ appName: 'application' })),
  };
});

describe('EnterpriseContractRow', () => {
  mockUseNamespaceHook('test-ns');

  it('should render the component', () => {
    render(
      <EnterpriseContractRow
        rowIndex={1}
        data={{
          title: 'dummyTitle',
          status: ENTERPRISE_CONTRACT_STATUS.successes,
          component: 'component-1',
          description: 'dummy description',
        }}
      />,
    );
    screen.getByText('dummyTitle');
    screen.getByText('component-1');
    screen.getByText('Success');
    expect(screen.queryByText('Failure Message')).not.toBeInTheDocument();
  });

  it('should render Failed rule and failure message in table', () => {
    render(
      <EnterpriseContractRow
        rowIndex={1}
        data={{
          title: 'dummyTitle',
          status: ENTERPRISE_CONTRACT_STATUS.violations,
          component: 'component-1',
          description: 'dummy description',
          msg: 'Fail',
          timestamp: '2022-01-01T00:00:00Z',
          collection: ['abcd', 'efg'],
        }}
      />,
    );
    screen.getByText('dummyTitle');
    screen.getByText('component-1');
    screen.getByText('Failed');
    fireEvent.click(screen.getByTestId('ec-expand-row'));
    screen.getByText('Effective from');
    screen.getByText('Collection');
    screen.getByText('abcd, efg');
    screen.getByText('Rule Description');
    screen.getByText('dummy description');
    screen.getAllByText('Fail');
  });
});
