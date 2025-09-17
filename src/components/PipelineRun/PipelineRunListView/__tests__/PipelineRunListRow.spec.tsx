import { fireEvent, render, waitFor } from '@testing-library/react';
import { DataState, testPipelineRuns } from '../../../../__data__/pipelinerun-data';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { PipelineRunListRowWithVulnerabilities } from '../PipelineRunListRow';

/* eslint-disable @typescript-eslint/no-explicit-any */

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => jest.fn(),
    Link: (props) => <a href={props.to}>{props.children}</a>,
    useSearchParams: jest.fn(),
    useLocation: jest.fn(() => ({ pathname: '/ns/test-ns' })),
  };
});

const watchResourceMock = createK8sWatchResourceMock();

describe('Pipeline run Row', () => {
  beforeEach(() => {
    watchResourceMock.mockReturnValue([[], false]);
  });
  it('should return - when pipelinerun is in running state ', () => {
    const runningPipelineRun = testPipelineRuns[DataState.RUNNING];
    const row = render(
      <PipelineRunListRowWithVulnerabilities obj={runningPipelineRun} columns={[]} />,
    );

    expect(row.getAllByText('-')).toBeDefined();
    expect(row.getByText('Running')).toBeDefined();
  });

  it('should return - when vulnerabilities is not available ', () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const plrName = succeededPlr.metadata.name;
    const row = render(
      <PipelineRunListRowWithVulnerabilities
        obj={succeededPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: [{ [plrName]: {} }] as any,
        }}
        columns={[]}
      />,
    );

    expect(row.getAllByText('-')).toBeDefined();
    expect(row.getByText('Succeeded')).toBeDefined();
  });

  it('should return N/A when vulnerabilities API errors out ', () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const plrName = succeededPlr.metadata.name;
    const row = render(
      <PipelineRunListRowWithVulnerabilities
        obj={succeededPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: [{ [plrName]: {} }] as any,
          error: new Error('500: Internal Server error'),
        }}
        columns={[]}
      />,
    );

    expect(row.getByText('N/A')).toBeDefined();
  });

  it('should show vulnerabilities when it is available ', () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const plrName = succeededPlr.metadata.name;
    const row = render(
      <PipelineRunListRowWithVulnerabilities
        obj={succeededPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: {
            [plrName]: [
              {
                vulnerabilities: {
                  critical: 5,
                  medium: 0,
                  high: 0,
                  low: 0,
                },
              },
            ],
          } as any,
        }}
        columns={[]}
      />,
    );

    expect(row.getByText('Critical')).toBeDefined();
    expect(row.getByText('5')).toBeDefined();
    expect(row.getByText('Succeeded')).toBeDefined();
  });

  it('should display correct PLR actions', async () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const plrName = succeededPlr.metadata.name;
    const row = render(
      <PipelineRunListRowWithVulnerabilities
        obj={succeededPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: [{ [plrName]: {} }] as any,
        }}
        columns={[]}
      />,
    );

    fireEvent.click(row.getByTestId('kebab-button'));

    await waitFor(() => {
      row.getByText('Rerun');
      row.getByText('Stop');
      row.getByText('Cancel');
    });
  });
});
