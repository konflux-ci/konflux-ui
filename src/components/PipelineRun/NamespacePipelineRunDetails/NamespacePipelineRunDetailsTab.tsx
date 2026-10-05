import { Link, useParams } from 'react-router-dom';
import {
  Bullseye,
  Spinner,
  Title,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  CodeBlock,
  CodeBlockCode,
  ClipboardCopy,
  Button,
} from '@patternfly/react-core';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import MetadataList from '~/components/MetadataList';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { createPipelineRunSBOMsModal } from '~/components/PipelineRun/PipelineRunDetailsView/tabs/PipelineRunSBOMsModal';
import RunParamsList from '~/components/PipelineRun/PipelineRunDetailsView/tabs/RunParamsList';
import RunResultsList from '~/components/PipelineRun/PipelineRunDetailsView/tabs/RunResultsList';
import ScanDescriptionListGroup from '~/components/PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';
import { SnapshotCreationStatus } from '~/components/PipelineRun/PipelineRunDetailsView/tabs/SnapshotCreationStatus';
import { usePipelineRunImageData } from '~/components/PipelineRun/PipelineRunDetailsView/usePipelineRunImageData';
import { getSBOMsFromTaskRuns } from '~/components/PipelineRun/PipelineRunDetailsView/utils/pipelinerun-utils';
import PipelineRunVisualization from '~/components/PipelineRun/PipelineRunDetailsView/visualization/PipelineRunVisualization';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunsForPipelineRuns } from '~/hooks/useTaskRunsV2';
import { useSbomUrl } from '~/hooks/useUIInstance';
import {
  COMPONENT_DETAILS_V2_PATH,
  GROUP_DETAILS_PATH,
  GROUP_SNAPSHOT_DETAILS_PATH,
  GROUP_INTEGRATION_TEST_DETAILS_PATH,
} from '~/routes/paths';
import { Timestamp } from '~/shared';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { getPLRLogSnippet } from '~/shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { getCommitSha, getCommitShortName } from '~/utils/commits-utils';
import { getPipelineRunDetailsPath } from '~/utils/pipeline-run-routes';
import { calculateDuration, pipelineRunStatus } from '~/utils/pipeline-utils';
import { getSourceUrl } from '~/utils/pipelinerun-utils';
import RelatedNamespacePipelineRuns from './RelatedNamespacePipelineRuns';

const NamespacePipelineRunDetailsTab = () => {
  const { pipelineRunName } = useParams();
  const namespace = useNamespace();
  const [run, loaded, error] = usePipelineRunV2(namespace, pipelineRunName);
  const [tasks, tasksLoaded, taskError] = useTaskRunsForPipelineRuns(namespace, pipelineRunName);
  const generateSbomUrl = useSbomUrl();
  const showModal = useModalLauncher();
  const { results, params: runParams, imageUrl: image } = usePipelineRunImageData(run, namespace);
  if (!loaded || !tasksLoaded)
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'pipeline run');
  if (!run) return getErrorState({ code: 404 }, true, 'pipeline run');

  const labels = run.metadata.labels;
  const groupName = labels?.[PipelineRunLabel.COMPONENT_GROUP];
  const componentName = labels?.[PipelineRunLabel.COMPONENT];
  const snapshotName =
    run.metadata.annotations?.[PipelineRunLabel.SNAPSHOT] || labels?.[PipelineRunLabel.SNAPSHOT];
  const integrationTestName = labels?.[PipelineRunLabel.TEST_SERVICE_SCENARIO];
  const params = { workspaceName: namespace, groupName };
  const status = pipelineRunStatus(run);
  const snippet = getPLRLogSnippet(run, tasks);
  const source = getSourceUrl(run);
  const sha = getCommitSha(run);
  const commitUrl = run.metadata.annotations?.[PipelineRunLabel.COMMIT_URL_ANNOTATION];
  const sboms = getSBOMsFromTaskRuns(tasks, generateSbomUrl);
  const fields = [
    { name: 'Name', value: run.metadata.name },
    { name: 'Namespace', value: namespace },
    { name: 'Labels', value: <MetadataList metadata={labels} /> },
    { name: 'Annotations', value: <MetadataList metadata={run.metadata.annotations} /> },
    { name: 'Created at', value: <Timestamp timestamp={run.metadata.creationTimestamp} /> },
    {
      name: 'Duration',
      value: calculateDuration(
        typeof run.status?.startTime === 'string' ? run.status.startTime : '',
        typeof run.status?.completionTime === 'string' ? run.status.completionTime : '',
      ),
    },
    { name: 'Status', value: <StatusIconWithText status={status} /> },
    {
      name: 'Message',
      value: run.status?.conditions?.find((condition) => condition.type === 'Succeeded')?.message,
    },
    { name: 'Pipeline', value: labels?.[PipelineRunLabel.PIPELINE_NAME] },
    {
      name: 'Component group',
      value: groupName && <Link to={GROUP_DETAILS_PATH.createPath(params)}>{groupName}</Link>,
    },
    {
      name: 'Component',
      value: componentName && (
        <Link
          to={COMPONENT_DETAILS_V2_PATH.createPath({ workspaceName: namespace, componentName })}
        >
          {componentName}
        </Link>
      ),
    },
    {
      name: 'Snapshot',
      value:
        snapshotName &&
        (groupName ? (
          <Link to={GROUP_SNAPSHOT_DETAILS_PATH.createPath({ ...params, snapshotName })}>
            {snapshotName}
          </Link>
        ) : (
          snapshotName
        )),
    },
    {
      name: 'Integration test',
      value:
        integrationTestName &&
        (groupName ? (
          <Link
            to={GROUP_INTEGRATION_TEST_DETAILS_PATH.createPath({ ...params, integrationTestName })}
          >
            {integrationTestName}
          </Link>
        ) : (
          integrationTestName
        )),
    },
    {
      name: 'Commit',
      value:
        sha &&
        (commitUrl ? (
          <ExternalLink href={commitUrl}>{getCommitShortName(sha)}</ExternalLink>
        ) : (
          getCommitShortName(sha)
        )),
    },
    { name: 'Related pipeline runs', value: <RelatedNamespacePipelineRuns pipelineRun={run} /> },
    { name: 'Source', value: source && <GitRepoLink url={source} /> },
    { name: 'Logs', value: <Link to={`${getPipelineRunDetailsPath(run)}/logs`}>See logs</Link> },
    {
      name: 'Download SBOM',
      value: image && <ClipboardCopy isReadOnly>{`cosign download sbom ${image}`}</ClipboardCopy>,
    },
    {
      name: 'SBOM',
      value:
        sboms.length === 1 ? (
          <ExternalLink href={sboms[0].url}>View SBOM</ExternalLink>
        ) : sboms.length > 1 ? (
          <Button
            variant="link"
            isInline
            onClick={() => showModal(createPipelineRunSBOMsModal({ sboms }))}
          >
            View SBOMs
          </Button>
        ) : null,
    },
  ];
  return (
    <>
      <Title headingLevel="h4" className="pf-v6-u-my-lg">
        Pipeline run details
      </Title>
      {taskError ? (
        getErrorState(taskError, tasksLoaded, 'task runs', true)
      ) : (
        <PipelineRunVisualization pipelineRun={run} taskRuns={tasks} error={undefined} />
      )}
      <DescriptionList columnModifier={{ lg: '2Col' }}>
        {fields.map(({ name, value }) => (
          <DescriptionListGroup key={name}>
            <DescriptionListTerm>{name}</DescriptionListTerm>
            <DescriptionListDescription>{value || '-'}</DescriptionListDescription>
          </DescriptionListGroup>
        ))}
        {snippet && (
          <DescriptionListGroup>
            <DescriptionListTerm>Failure</DescriptionListTerm>
            <DescriptionListDescription>
              {snippet.title}
              {'staticMessage' in snippet && (
                <CodeBlock>
                  <CodeBlockCode>{snippet.staticMessage}</CodeBlockCode>
                </CodeBlock>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        <SnapshotCreationStatus pipelineRun={run} />
        <ScanDescriptionListGroup
          taskRuns={tasks}
          pipelineRun={run}
          showLogsLink
          hideIfNotFound
          errorState={getErrorState(taskError, tasksLoaded, 'task runs')}
        />
      </DescriptionList>
      {!!results?.length && (
        <div className="pf-v6-u-mt-lg">
          <RunResultsList results={results} status={status} />
        </div>
      )}
      {!!runParams?.length && (
        <div className="pf-v6-u-mt-lg">
          <RunParamsList params={runParams} />
        </div>
      )}
    </>
  );
};

export default NamespacePipelineRunDetailsTab;
