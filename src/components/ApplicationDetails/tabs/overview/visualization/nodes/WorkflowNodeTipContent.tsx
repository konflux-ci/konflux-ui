import * as React from 'react';
import { Link } from 'react-router-dom';
import { css } from '@patternfly/react-styles';
import {
  getRunStatusModifier,
  Node,
  NodeModel,
  StatusIcon,
  RunStatus,
  PipelineNodeModel,
} from '@patternfly/react-topology';
import pipelineStyles from '@patternfly/react-topology/dist/esm/css/topology-pipelines';
import { useWorkspaceInfo } from '../../../../../Workspace/useWorkspaceInfo';
import { WorkflowNodeModelData, WorkflowNodeType } from '../types';
import { getLinksForElement, statusToRunStatus, TYPE_DESCRIPTIONS } from '../utils/node-utils';
import './WorkflowNodeTipContent.scss';

type WorkflowNodeTipContentProps = {
  element: Node<NodeModel, WorkflowNodeModelData>;
};

const WorkflowNodeTipContent: React.FC<React.PropsWithChildren<WorkflowNodeTipContentProps>> = ({
  element,
}) => {
  const { workflowType, children } = element.getData();
  const label = element.getLabel();
  const { workspace } = useWorkspaceInfo();
  const { elementRef, pipelinesRef, appRef } = getLinksForElement(element, workspace);

  const links = React.useMemo(() => {
    switch (workflowType) {
      case WorkflowNodeType.COMPONENT:
        return [
          <Link key="element-link" data-test="element-link" to={elementRef}>
            View Components
          </Link>,
        ];
      case WorkflowNodeType.STATIC_ENVIRONMENT:
      case WorkflowNodeType.MANAGED_ENVIRONMENT:
        return [
          <Link key="element-link" data-test="element-link" to={elementRef}>
            View Environments
          </Link>,
        ];
      case WorkflowNodeType.BUILD:
      case WorkflowNodeType.RELEASE:
        return [
          <Link key="pipeline-runs-link" data-test="pipeline-runs-link" to={pipelinesRef}>
            View pipeline runs
          </Link>,
        ];
      case WorkflowNodeType.TESTS:
        return [
          <Link key="element-link" data-test="element-link" to={elementRef}>
            Open tests tab
          </Link>,
          <Link key="pipeline-runs-link" data-test="pipeline-runs-link" to={pipelinesRef}>
            View pipeline runs
          </Link>,
        ];
      case WorkflowNodeType.APPLICATION_TEST:
        return [
          <Link key="element-link" data-test="element-link" to={elementRef}>
            View details
          </Link>,
          <Link key="pipeline-runs-link" data-test="pipeline-runs-link" to={pipelinesRef}>
            View pipeline runs
          </Link>,
        ];
      default:
        return null;
    }
  }, [elementRef, pipelinesRef, workflowType]);

  const runStatusItem = (child: PipelineNodeModel) => {
    const { status } = child.data;
    if (!status) {
      return null;
    }
    const runStatus = statusToRunStatus(status as string);
    return (
      <>
        <span
          className={css(
            pipelineStyles.topologyPipelinesStatusIcon,
            (runStatus === RunStatus.Running || runStatus === RunStatus.InProgress) &&
              pipelineStyles.modifiers.spin,
            getRunStatusModifier(runStatus),
          )}
        >
          <StatusIcon status={runStatus} />
        </span>{' '}
        {child.data.status}
      </>
    );
  };

  return (
    <div className="workload-node__tooltip">
      <div className="workload-node__tooltip-title">{label}</div>
      <div className="workload-node__tooltip-description">{TYPE_DESCRIPTIONS[workflowType]}</div>
      {children?.length ? (
        <div className="workload-node__tooltip-status-area">
          {children
            .filter((c) => !c.data.hidden && !c.data.isDisabled)
            .map((child) => (
              <React.Fragment key={child.id}>
                <span data-test="child-row">{child.label}</span>
                <span>{runStatusItem(child)}</span>
                <span>
                  {child.data?.pipelineRun ? (
                    <Link
                      to={`${appRef}/pipelineruns/${child.data?.pipelineRun?.metadata.name}/logs`}
                    >
                      View logs
                    </Link>
                  ) : null}
                </span>
              </React.Fragment>
            ))}
        </div>
      ) : null}
      {links ? (
        <div data-id="tip-links" className="workload-node__tooltip-links">
          {links}
        </div>
      ) : null}
    </div>
  );
};

export default WorkflowNodeTipContent;
