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
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import MetadataList from '~/components/MetadataList';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import RelatedNamespacePipelineRuns from '~/components/PipelineRun/NamespacePipelineRunDetails/RelatedNamespacePipelineRuns';
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
  const failureMessage = run.status?.conditions?.find(
    (condition) => condition.type === 'Succeeded',
  )?.message;
  const staticMessage = snippet && 'staticMessage' in snippet ? snippet.staticMessage : undefined;

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
      <Flex direction={{ default: 'row' }}>
        <FlexItem style={{ flex: 1 }}>
          <DescriptionList columnModifier={{ default: '1Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>Name</DescriptionListTerm>
              <DescriptionListDescription>{run.metadata.name || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Namespace</DescriptionListTerm>
              <DescriptionListDescription>{namespace || '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Labels</DescriptionListTerm>
              <DescriptionListDescription>
                <MetadataList metadata={labels} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Annotations</DescriptionListTerm>
              <DescriptionListDescription>
                <MetadataList metadata={run.metadata.annotations} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Created at</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={run.metadata.creationTimestamp} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>
                {calculateDuration(
                  typeof run.status?.startTime === 'string' ? run.status.startTime : '',
                  typeof run.status?.completionTime === 'string' ? run.status.completionTime : '',
                ) || '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <SnapshotCreationStatus pipelineRun={run} />
          </DescriptionList>
        </FlexItem>
        <FlexItem style={{ flex: 1 }}>
          <DescriptionList columnModifier={{ default: '1Col' }}>
            <DescriptionListGroup>
              <DescriptionListTerm>Status</DescriptionListTerm>
              <DescriptionListDescription>
                <StatusIconWithText status={status} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            {snippet && (
              <>
                <DescriptionListGroup>
                  <DescriptionListTerm>Message</DescriptionListTerm>
                  <DescriptionListDescription>
                    {snippet.title}
                    {failureMessage && failureMessage !== staticMessage && (
                      <CodeBlock>
                        <CodeBlockCode>{failureMessage}</CodeBlockCode>
                      </CodeBlock>
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Log snippet</DescriptionListTerm>
                  <DescriptionListDescription>
                    <CodeBlock>
                      <CodeBlockCode>{staticMessage ?? '-'}</CodeBlockCode>
                    </CodeBlock>
                    <Link to={`${getPipelineRunDetailsPath(run)}/logs`}>See logs</Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Pipeline</DescriptionListTerm>
              <DescriptionListDescription>
                {labels?.[PipelineRunLabel.PIPELINE_NAME] || '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {snapshotName && (
              <DescriptionListGroup>
                <DescriptionListTerm>Snapshot</DescriptionListTerm>
                <DescriptionListDescription>
                  {groupName ? (
                    <Link to={GROUP_SNAPSHOT_DETAILS_PATH.createPath({ ...params, snapshotName })}>
                      {snapshotName}
                    </Link>
                  ) : (
                    snapshotName
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {image && (
              <DescriptionListGroup>
                <DescriptionListTerm>Download SBOM</DescriptionListTerm>
                <DescriptionListDescription>
                  <ClipboardCopy isReadOnly>{`cosign download sbom ${image}`}</ClipboardCopy>
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {sboms.length > 0 && (
              <DescriptionListGroup>
                <DescriptionListTerm>SBOM</DescriptionListTerm>
                <DescriptionListDescription>
                  {sboms.length === 1 ? (
                    <ExternalLink href={sboms[0].url}>View SBOM</ExternalLink>
                  ) : (
                    <Button
                      variant="link"
                      isInline
                      onClick={() => showModal(createPipelineRunSBOMsModal({ sboms }))}
                    >
                      View SBOMs
                    </Button>
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Component group</DescriptionListTerm>
              <DescriptionListDescription>
                {groupName ? (
                  <Link to={GROUP_DETAILS_PATH.createPath(params)}>{groupName}</Link>
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <ScanDescriptionListGroup
              taskRuns={tasks}
              pipelineRun={run}
              showLogsLink
              hideIfNotFound
              errorState={getErrorState(taskError, tasksLoaded, 'task runs')}
            />
            <DescriptionListGroup>
              <DescriptionListTerm>Component</DescriptionListTerm>
              <DescriptionListDescription>
                {componentName ? (
                  <Link
                    to={COMPONENT_DETAILS_V2_PATH.createPath({
                      workspaceName: namespace,
                      componentName,
                    })}
                  >
                    {componentName}
                  </Link>
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {sha && (
              <DescriptionListGroup>
                <DescriptionListTerm>Commit</DescriptionListTerm>
                <DescriptionListDescription>
                  {commitUrl ? (
                    <ExternalLink href={commitUrl}>{getCommitShortName(sha)}</ExternalLink>
                  ) : (
                    getCommitShortName(sha)
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {source && (
              <DescriptionListGroup>
                <DescriptionListTerm>Source</DescriptionListTerm>
                <DescriptionListDescription>
                  <GitRepoLink url={source} />
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            {integrationTestName && (
              <DescriptionListGroup>
                <DescriptionListTerm>Integration test</DescriptionListTerm>
                <DescriptionListDescription>
                  {groupName ? (
                    <Link
                      to={GROUP_INTEGRATION_TEST_DETAILS_PATH.createPath({
                        ...params,
                        integrationTestName,
                      })}
                    >
                      {integrationTestName}
                    </Link>
                  ) : (
                    integrationTestName
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            )}
            <DescriptionListGroup>
              <DescriptionListTerm>Related pipeline runs</DescriptionListTerm>
              <DescriptionListDescription>
                <RelatedNamespacePipelineRuns pipelineRun={run} />
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
      </Flex>
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
