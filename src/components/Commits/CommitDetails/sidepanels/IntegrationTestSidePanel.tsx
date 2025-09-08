import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
} from '@patternfly/react-core';
import { ElementModel, GraphElement } from '@patternfly/react-topology';
import PipelineIcon from '../../../../assets/pipelineIcon.svg';
import { PipelineRunLabel } from '../../../../consts/pipelinerun';
import { useTaskRuns } from '../../../../hooks/useTaskRuns';
import {
  COMPONENT_DETAILS_PATH,
  INTEGRATION_TEST_DETAILS_PATH,
  PIPELINE_RUNS_LOG_PATH,
} from '../../../../routes/paths';
import { ErrorDetailsWithStaticLog } from '../../../../shared/components/pipeline-run-logs/logs/log-snippet-types';
import { getPLRLogSnippet } from '../../../../shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { Timestamp } from '../../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../../types';
import { calculateDuration } from '../../../../utils/pipeline-utils';
import ScanDescriptionListGroup from '../../../PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';
import { StatusIconWithTextLabel } from '../../../topology/StatusIcon';
import { CommitWorkflowNodeModelData } from '../visualization/commit-visualization-types';

export interface IntegrationTestSidePanelBodyProps {
  onClose: () => void;
  workflowNode: GraphElement<ElementModel, CommitWorkflowNodeModelData>;
}

const IntegrationTestSidePanel: React.FC<
  React.PropsWithChildren<IntegrationTestSidePanelBodyProps>
> = ({ workflowNode, onClose }) => {
  const namespace = useNamespace();
  const workflowData = workflowNode.getData();
  const integrationTestPipeline = workflowData.resource as PipelineRunKind;
  const [taskRuns, taskRunsLoaded, taskRunsError] = useTaskRuns(
    namespace,
    integrationTestPipeline?.metadata.name,
  );

  const duration = integrationTestPipeline
    ? calculateDuration(
        typeof integrationTestPipeline.status?.startTime === 'string'
          ? integrationTestPipeline.status?.startTime
          : '',
        typeof integrationTestPipeline.status?.completionTime === 'string'
          ? integrationTestPipeline.status?.completionTime
          : '',
      )
    : '-';

  const pipelineRunFailed = (getPLRLogSnippet(integrationTestPipeline, taskRuns) ||
    {}) as ErrorDetailsWithStaticLog;

  return (
    <>
      <div className="commit-side-panel__head">
        <DrawerHead data-test="int-test-side-panel-head">
          <span className="commit-side-panel__head-title">
            {integrationTestPipeline ? (
              <Link
                to={INTEGRATION_TEST_DETAILS_PATH.createPath({
                  applicationName: workflowData.application,
                  workspaceName: namespace,
                  integrationTestName: workflowNode.getLabel(),
                })}
              >
                {workflowNode.getLabel()}
              </Link>
            ) : (
              workflowNode.getLabel()
            )}
            <StatusIconWithTextLabel status={workflowNode.getData().status} />
          </span>
          <span className="pf-v5-u-mt-xs commit-side-panel__subtext">
            <PipelineIcon role="img" aria-label="Pipeline run" /> Integration test
          </span>
          <DrawerActions>
            <DrawerCloseButton onClick={onClose} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody data-test="int-test-side-panel-body">
          <DescriptionList
            data-test="pipeline-run-details"
            columnModifier={{
              default: '2Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Started</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp
                  timestamp={integrationTestPipeline?.metadata?.creationTimestamp ?? '-'}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>{duration ?? '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Type</DescriptionListTerm>
              <DescriptionListDescription>Test</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Pipeline</DescriptionListTerm>
              <DescriptionListDescription>
                {integrationTestPipeline?.metadata?.namespace ?? '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
          <DescriptionList
            className="pf-v5-u-mt-lg"
            data-test="pipeline-run-details"
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Component</DescriptionListTerm>
              <DescriptionListDescription>
                {integrationTestPipeline?.metadata?.labels?.[PipelineRunLabel.COMPONENT] ? (
                  integrationTestPipeline?.metadata?.labels?.[PipelineRunLabel.APPLICATION] ? (
                    <Link
                      to={COMPONENT_DETAILS_PATH.createPath({
                        applicationName:
                          integrationTestPipeline.metadata.labels[PipelineRunLabel.APPLICATION],
                        componentName:
                          integrationTestPipeline.metadata.labels[PipelineRunLabel.COMPONENT],
                        workspaceName: namespace,
                      })}
                    >
                      {integrationTestPipeline.metadata.labels[PipelineRunLabel.COMPONENT]}
                    </Link>
                  ) : (
                    integrationTestPipeline?.metadata.labels[PipelineRunLabel.COMPONENT]
                  )
                ) : (
                  '-'
                )}
              </DescriptionListDescription>
            </DescriptionListGroup>
            {integrationTestPipeline && taskRunsLoaded && !taskRunsError ? (
              <ScanDescriptionListGroup taskRuns={taskRuns} hideIfNotFound showLogsLink />
            ) : null}
          </DescriptionList>
          {Object.keys(pipelineRunFailed).length > 0 && (
            <DescriptionList
              className="pf-v5-u-mt-lg"
              data-test="pipeline-run-details"
              columnModifier={{
                default: '1Col',
              }}
            >
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
                  {integrationTestPipeline ? (
                    <Button
                      variant="link"
                      isInline
                      component={(props) => (
                        <Link
                          {...props}
                          to={PIPELINE_RUNS_LOG_PATH.createPath({
                            applicationName: workflowData.application,
                            pipelineRunName: integrationTestPipeline.metadata?.name,
                            workspaceName: namespace,
                          })}
                        />
                      )}
                    >
                      See logs
                    </Button>
                  ) : null}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          )}
        </DrawerPanelBody>
      </div>
    </>
  );
};

export default IntegrationTestSidePanel;
