import { render, screen } from '@testing-library/react';
import { UIConformaData, CONFORMA_RESULT_STATUS } from '~/types/conforma';
import { mockUseNamespaceHook } from '~/unit-test-utils/mock-namespace';
import { ConformaExpandedRowContent } from '../ConformaExpandedRowContent';
import { WrappedConformaRow } from '../ConformaRow';

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

const dummySuccessRowData = {
  title: 'dummyTitle',
  status: CONFORMA_RESULT_STATUS.successes,
  component: 'component-1',
  description: 'dummy description',
} as UIConformaData;

const dumpFailRowData = {
  title: 'dummyTitle',
  status: CONFORMA_RESULT_STATUS.violations,
  component: 'component-1',
  description: 'dummy description',
  msg: 'Fail',
  timestamp: '2022-01-01T00:00:00Z',
  collection: ['abcd', 'efg'],
};

const customDummyData = {
  sortedConformaResult: [dummySuccessRowData, dumpFailRowData],
};
describe('ConformaRow', () => {
  mockUseNamespaceHook('test-ns');

  it('should render the component', () => {
    render(<WrappedConformaRow customData={customDummyData} obj={dummySuccessRowData} />);
    screen.getByText('dummyTitle');
    screen.getByText('component-1');
    screen.getByText('Success');
    expect(screen.queryByText('Failure Message')).not.toBeInTheDocument();
  });

  it('should render Failed rule and failure message in table', () => {
    render(
      <>
        <WrappedConformaRow customData={customDummyData} obj={dumpFailRowData} />
        <ConformaExpandedRowContent obj={dumpFailRowData} />
      </>,
    );
    screen.getByText('dummyTitle');
    screen.getByText('component-1');
    screen.getByText('Failed');

    screen.getByText('Effective from');
    screen.getByText('Collection');
    screen.getByText('abcd, efg');
    screen.getByText('Rule Description');
    screen.getByText('dummy description');
    screen.getAllByText('Fail');
  });
});
