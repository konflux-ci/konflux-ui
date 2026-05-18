import { fireEvent, waitFor } from '@testing-library/react';
import { PipelineRunColumnKeys } from '~/consts/pipeline';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { PipelineRunKind } from '~/types';
import { renderWithQueryClient } from '~/unit-test-utils/mock-react-query';
import { DataState, testPipelineRuns } from '../../../../__data__/pipelinerun-data';
import { createK8sWatchResourceMock } from '../../../../utils/test-utils';
import { pipelineWithCommits } from '../../../Commits/__data__/pipeline-with-commits';
import {
  PipelineRunListRow,
  PipelineRunListRowWithColumns,
  PipelineRunListRowWithVulnerabilities,
} from '../PipelineRunListRow';

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

jest.mock('../../../../hooks/useScanResults', () => ({
  useKarchScanResults: jest.fn(() => [
    [],
    true,
    undefined,
    () => {},
    { isFetchingNextPage: false, hasNextPage: false },
  ]),
  usePLRVulnerabilities: jest.fn(() => ({ vulnerabilities: {}, fetchedPipelineRuns: [] })),
}));

describe('Pipeline run Row', () => {
  beforeEach(() => {
    watchResourceMock.mockReturnValue([[], false]);
  });
  it('should return - when pipelinerun is in running state ', () => {
    const runningPipelineRun = testPipelineRuns[DataState.RUNNING];
    const row = renderWithQueryClient(
      <PipelineRunListRowWithVulnerabilities obj={runningPipelineRun} columns={[]} />,
    );

    expect(row.getAllByText('-')).toBeDefined();
    expect(row.getByText('Running')).toBeDefined();
  });

  it('should return - when vulnerabilities is not available ', () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const plrName = succeededPlr.metadata.name;
    const row = renderWithQueryClient(
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
    const row = renderWithQueryClient(
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
    const row = renderWithQueryClient(
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
    const row = renderWithQueryClient(
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

  it('should show no attestation when pipeline run is running', () => {
    const runningPlr = testPipelineRuns[DataState.RUNNING];
    const plrName = runningPlr.metadata.name;

    const row = renderWithQueryClient(
      <PipelineRunListRowWithColumns
        obj={runningPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: [{ [plrName]: {} }] as any,
        }}
        columns={['name']}
        visibleColumns={new Set<PipelineRunColumnKeys>(['name'])}
      />,
    );

    expect(row.queryByTestId('attestation-signed')).toBeNull();
    expect(row.queryByTestId('attestation-unsigned')).toBeNull();
  });

  it('should show signed attestation when chains signed annotation is true', () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const signedPlr = {
      ...succeededPlr,
      metadata: {
        ...succeededPlr.metadata,
        annotations: {
          ...succeededPlr.metadata.annotations,
          'chains.tekton.dev/signed': 'true',
        },
      },
    };
    const plrName = signedPlr.metadata.name;

    const row = renderWithQueryClient(
      <PipelineRunListRowWithColumns
        obj={signedPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: [{ [plrName]: {} }] as any,
        }}
        columns={['name']}
        visibleColumns={new Set<PipelineRunColumnKeys>(['name'])}
      />,
    );

    expect(row.getByTestId('attestation-signed')).toBeDefined();
  });

  it('should show warning attestation when pipeline run is not signed', () => {
    const succeededPlr = testPipelineRuns[DataState.SUCCEEDED];
    const plrName = succeededPlr.metadata.name;

    const row = renderWithQueryClient(
      <PipelineRunListRowWithColumns
        obj={succeededPlr}
        customData={{
          fetchedPipelineRuns: [plrName],
          vulnerabilities: [{ [plrName]: {} }] as any,
        }}
        columns={['name']}
        visibleColumns={new Set<PipelineRunColumnKeys>(['name'])}
      />,
    );

    expect(row.getByTestId('attestation-unsigned')).toBeDefined();
  });

  describe('merged trigger cell', () => {
    const triggerOnlyColumns = new Set<PipelineRunColumnKeys>(['trigger']);

    it('renders event label and commit reference in one trigger column for pull request', () => {
      const plr = pipelineWithCommits[0];

      const row = renderWithQueryClient(
        <PipelineRunListRowWithColumns
          obj={plr}
          customData={{ fetchedPipelineRuns: [], vulnerabilities: {} }}
          columns={['trigger']}
          visibleColumns={triggerOnlyColumns}
        />,
      );

      expect(row.getByText('Pull Request')).toBeInTheDocument();
      expect(row.getByRole('link', { name: 'commit1' })).toHaveAttribute(
        'href',
        'https://github.com/devfile-samples/devfile-sample-java-springboot-basic',
      );
      const pullRequestLink = row
        .getAllByRole('link')
        .find((link) => link.getAttribute('href') === 'https://github.com/test/test-repo/pull/11');
      expect(pullRequestLink).toBeDefined();
    });

    it('renders push event label and commit link without a pull request link', () => {
      const pushPlr: PipelineRunKind = {
        ...pipelineWithCommits[0],
        metadata: {
          ...pipelineWithCommits[0].metadata,
          labels: {
            ...pipelineWithCommits[0].metadata.labels,
            [PipelineRunLabel.COMMIT_EVENT_TYPE_LABEL]: 'push',
            [PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL]: '',
          },
        },
      };

      const row = renderWithQueryClient(
        <PipelineRunListRowWithColumns
          obj={pushPlr}
          customData={{ fetchedPipelineRuns: [], vulnerabilities: {} }}
          columns={['trigger']}
          visibleColumns={triggerOnlyColumns}
        />,
      );

      expect(row.getByText('Push')).toBeInTheDocument();
      expect(row.getByRole('link', { name: 'commit1' })).toBeInTheDocument();
      expect(
        row.queryAllByRole('link').some((link) => link.getAttribute('href')?.includes('/pull/')),
      ).toBe(false);
    });

    it('renders commit reference only in the trigger column', () => {
      const plr = pipelineWithCommits[0];
      const visibleColumns = new Set<PipelineRunColumnKeys>(['trigger']);

      const row = renderWithQueryClient(
        <PipelineRunListRowWithColumns
          obj={plr}
          customData={{ fetchedPipelineRuns: [], vulnerabilities: {} }}
          columns={['trigger']}
          visibleColumns={visibleColumns}
        />,
      );

      expect(row.getAllByRole('link', { name: 'commit1' })).toHaveLength(1);
      expect(row.getByText('Pull Request')).toBeInTheDocument();
    });

    it('renders merged trigger cell in the legacy row variant', () => {
      const plr = pipelineWithCommits[0];

      const row = renderWithQueryClient(<PipelineRunListRow obj={plr} columns={[]} />);

      expect(row.getByText('Pull Request')).toBeInTheDocument();
      expect(row.getByRole('link', { name: 'commit1' })).toBeInTheDocument();
    });
  });
});
