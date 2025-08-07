import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Flex,
  FlexItem,
  Title,
  Divider,
  ClipboardCopy,
  Bullseye,
  Spinner,
} from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { usePipelineRun } from '../../../../hooks/usePipelineRuns';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import { useSbomUrl } from '../../../../hooks/useUIInstance';
import {
  SNAPSHOT_DETAILS_PATH,
  PIPELINE_RUNS_LOG_PATH,
  APPLICATION_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  COMMIT_DETAILS_PATH,
  INTEGRATION_TEST_DETAILS_PATH,
} from '../../../../routes/paths';
import { RouterParams } from '../../../../routes/utils';
import { Timestamp } from '../../../../shared';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import { ErrorDetailsWithStaticLog } from '../../../../shared/components/pipeline-run-logs/logs/log-snippet-types';
import { getPLRLogSnippet } from '../../../../shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { getCommitSha, getCommitShortName } from '../../../../utils/commits-utils';
import {
  calculateDuration,
  getPipelineRunStatusResultForName,
  getPipelineRunStatusResults,
  pipelineRunStatus,
  SBOMResultKeys,
} from '../../../../utils/pipeline-utils';
import GitRepoLink from '../../../GitLink/GitRepoLink';
import MetadataList from '../../../MetadataList';
import { StatusIconWithText } from '../../../StatusIcon/StatusIcon';
import RelatedPipelineRuns from '../RelatedPipelineRuns';
import { getSourceUrl } from '../utils/pipelinerun-utils';
import PipelineRunVisualization from '../visualization/PipelineRunVisualization';
import RunResultsList from './RunResultsList';
import ScanDescriptionListGroup from './ScanDescriptionListGroup';

const PipelineRunDetailsTab: React.FC = () => {
  const pipelineRunName = useParams<RouterParams>().pipelineRunName;
  const namespace = useNamespace();
  const generateSbomUrl = useSbomUrl();
  const [pipelineRun, loaded, error] = usePipelineRun(namespace, pipelineRunName);
  const [taskRuns, taskRunsLoaded, taskRunError] = useTaskRuns(namespace, pipelineRunName);

  const snapshotStatusAnnotation =
    pipelineRun.metadata?.annotations?.[PipelineRunLabel.CREATE_SNAPSHOT_STATUS];

  const snapshotCreationStatus = React.useMemo(() => {
    try {
      return JSON.parse(snapshotStatusAnnotation);
    } catch (e) {
      return null;
    }
  }, [snapshotStatusAnnotation]);

  const imageDigest = getPipelineRunStatusResultForName(
    SBOMResultKeys.IMAGE_DIGEST,
    pipelineRun,
  )?.value;
  const sbomSha = getPipelineRunStatusResultForName(SBOMResultKeys.SBOM_SHA, pipelineRun)?.value;

  const sbomURL = React.useMemo(() => {
    if (!imageDigest) return null;
    return generateSbomUrl(imageDigest, sbomSha) || null;
  }, [generateSbomUrl, imageDigest, sbomSha]);

  if (!(loaded && taskRunsLoaded)) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'pipeline run');
  }

  const results = getPipelineRunStatusResults(pipelineRun);
  const pipelineRunFailed = (getPLRLogSnippet(pipelineRun, taskRuns) ||
    {}) as ErrorDetailsWithStaticLog;
  const duration = calculateDuration(
    typeof pipelineRun.status?.startTime === 'string' ? pipelineRun.status?.startTime : '',
    typeof pipelineRun.status?.completionTime === 'string'
      ? pipelineRun.status?.completionTime
      : '',
  );
  const sha = getCommitSha(pipelineRun);
  const applicationName = pipelineRun.metadata?.labels[PipelineRunLabel.APPLICATION];
  const buildImage =
    pipelineRun.metadata?.annotations?.[PipelineRunLabel.BUILD_IMAGE_ANNOTATION] ||
    getPipelineRunStatusResultForName(`IMAGE_URL`, pipelineRun)?.value;
  const sourceUrl = getSourceUrl(pipelineRun);
  const pipelineStatus = !error ? pipelineRunStatus(pipelineRun) : null;
  const integrationTestName = pipelineRun.metadata.labels[PipelineRunLabel.TEST_SERVICE_SCENARIO];
  const snapshot =
    pipelineRun.metadata?.annotations?.[PipelineRunLabel.SNAPSHOT] ||
    pipelineRun.metadata?.labels?.[PipelineRunLabel.SNAPSHOT];

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg" size="lg">
        Pipeline run details
      </Title>
      {taskRunError ? (
        <div className="pf-v5-u-pb-lg">
          {getErrorState(taskRunError, taskRunsLoaded, 'task runs', true)}
        </div>
      ) : (
        <PipelineRunVisualization pipelineRun={pipelineRun} error={error} taskRuns={taskRuns} />
      )}
      {!error && (
        <>
          <Flex direction={{ default: 'row' }}>
            <FlexItem style={{ flex: 1 }}>
              <DescriptionList
                data-test="pipelinerun-details"
                columnModifier={{
                  default: '1Col',
                }}
              >
                <DescriptionListGroup>
                  <DescriptionListTerm>Name</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pipelineRun.metadata?.name ?? '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Namespace</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pipelineRun.metadata?.namespace ?? '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Labels</DescriptionListTerm>
                  <DescriptionListDescription>
                    <MetadataList metadata={pipelineRun.metadata?.labels} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Annotations</DescriptionListTerm>
                  <DescriptionListDescription>
                    <MetadataList metadata={pipelineRun.metadata?.annotations} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Created at</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp timestamp={pipelineRun.metadata?.creationTimestamp ?? '-'} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>Duration</DescriptionListTerm>
                  <DescriptionListDescription>{duration ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>
                {snapshotCreationStatus && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Snapshot creation status</DescriptionListTerm>
                    <DescriptionListDescription>
                      {snapshotCreationStatus.message}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
            </FlexItem>
            <FlexItem style={{ flex: 1 }}>
              <DescriptionList
                data-test="pipelinerun-details"
                columnModifier={{
                  default: '1Col',
                }}
              >
                <DescriptionListGroup>
                  <DescriptionListTerm>Status</DescriptionListTerm>
                  <DescriptionListDescription>
                    <StatusIconWithText
                      status={pipelineStatus}
                      dataTestAttribute={'pipelinerun-details status'}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {Object.keys(pipelineRunFailed).length > 0 && (
                  <>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Message</DescriptionListTerm>
                      <DescriptionListDescription>
                        {pipelineRunFailed.title ?? '-'}
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                    <DescriptionListGroup>
                      <DescriptionListTerm>Log snippet</DescriptionListTerm>
                      <DescriptionListDescription>
                        <CodeBlock>
                          <CodeBlockCode id="code-content">
                            {pipelineRunFailed.staticMessage ?? '-'}
                          </CodeBlockCode>
                        </CodeBlock>
                        <Button
                          variant="link"
                          isInline
                          component={(props) => (
                            <Link
                              {...props}
                              to={PIPELINE_RUNS_LOG_PATH.createPath({
                                workspaceName: namespace,
                                applicationName,
                                pipelineRunName: pipelineRun.metadata?.name,
                              })}
                            />
                          )}
                        >
                          See logs
                        </Button>
                      </DescriptionListDescription>
                    </DescriptionListGroup>
                  </>
                )}
                <DescriptionListGroup>
                  <DescriptionListTerm>Pipeline</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pipelineRun.metadata?.labels[PipelineRunLabel.PIPELINE_NAME] ?? '-'}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {snapshot && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Snapshot</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Link
                        to={SNAPSHOT_DETAILS_PATH.createPath({
                          workspaceName: namespace,
                          applicationName,
                          snapshotName: snapshot,
                        })}
                      >
                        {snapshot}
                      </Link>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {buildImage && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Download SBOM</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
                        {`cosign download sbom ${buildImage}`}
                      </ClipboardCopy>
                      <ExternalLink href="https://docs.sigstore.dev/cosign/installation">
                        Install Cosign
                      </ExternalLink>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {sbomURL && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>SBOM</DescriptionListTerm>
                    <DescriptionListDescription>
                      <ExternalLink href={sbomURL}>View SBOM</ExternalLink>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                <DescriptionListGroup>
                  <DescriptionListTerm>Application</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pipelineRun.metadata?.labels?.[PipelineRunLabel.APPLICATION] ? (
                      <Link
                        to={APPLICATION_DETAILS_PATH.createPath({
                          workspaceName: namespace,
                          applicationName:
                            pipelineRun.metadata?.labels[PipelineRunLabel.APPLICATION],
                        })}
                      >
                        {pipelineRun.metadata?.labels[PipelineRunLabel.APPLICATION]}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {!taskRunError && <ScanDescriptionListGroup taskRuns={taskRuns} showLogsLink />}
                <DescriptionListGroup>
                  <DescriptionListTerm>Component</DescriptionListTerm>
                  <DescriptionListDescription>
                    {pipelineRun.metadata?.labels?.[PipelineRunLabel.COMPONENT] ? (
                      pipelineRun.metadata?.labels?.[PipelineRunLabel.APPLICATION] ? (
                        <Link
                          to={COMPONENT_DETAILS_PATH.createPath({
                            workspaceName: namespace,
                            applicationName:
                              pipelineRun.metadata.labels[PipelineRunLabel.APPLICATION],
                            componentName: pipelineRun.metadata.labels[PipelineRunLabel.COMPONENT],
                          })}
                        >
                          {pipelineRun.metadata.labels[PipelineRunLabel.COMPONENT]}
                        </Link>
                      ) : (
                        pipelineRun.metadata.labels[PipelineRunLabel.COMPONENT]
                      )
                    ) : (
                      '-'
                    )}
                  </DescriptionListDescription>
                </DescriptionListGroup>
                {sha && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Commit</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Link
                        to={COMMIT_DETAILS_PATH.createPath({
                          workspaceName: namespace,
                          applicationName:
                            pipelineRun.metadata.labels[PipelineRunLabel.APPLICATION],
                          commitName: sha,
                        })}
                      >
                        {getCommitShortName(sha)}
                      </Link>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {sourceUrl && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Source</DescriptionListTerm>
                    <DescriptionListDescription>
                      <GitRepoLink url={sourceUrl} />
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                {integrationTestName && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>Integration test</DescriptionListTerm>
                    <DescriptionListDescription>
                      <Link
                        to={INTEGRATION_TEST_DETAILS_PATH.createPath({
                          workspaceName: namespace,
                          applicationName:
                            pipelineRun.metadata.labels[PipelineRunLabel.APPLICATION],
                          integrationTestName,
                        })}
                      >
                        {integrationTestName}
                      </Link>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                )}
                <DescriptionListGroup>
                  <DescriptionListTerm>Related pipelines</DescriptionListTerm>
                  <DescriptionListDescription>
                    <RelatedPipelineRuns pipelineRun={pipelineRun} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </FlexItem>
          </Flex>

          {results ? (
            <>
              <Divider style={{ padding: 'var(--pf-v5-global--spacer--lg) 0' }} />
              <RunResultsList results={results} status={pipelineStatus} />
            </>
          ) : null}
        </>
      )}
    </>
  );
};

export default PipelineRunDetailsTab;
