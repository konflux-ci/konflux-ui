import * as React from 'react';
import { Link } from 'react-router-dom';
import {
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
import { useNamespace } from '~/shared/providers/Namespace';
import PipelineIcon from '../../../../assets/pipelineIcon.svg';
import { PIPELINE_RUNS_LIST_PATH } from '../../../../routes/paths';
import { RELEASE_DESC } from '../../../../utils/pipeline-utils';
import { StatusIconWithTextLabel } from '../../../topology/StatusIcon';
import { CommitWorkflowNodeModelData } from '../visualization/commit-visualization-types';

export interface ReleaseSidePanelBodyProps {
  onClose: () => void;
  workflowNode: GraphElement<ElementModel, CommitWorkflowNodeModelData>;
}

const ReleaseSidePanel: React.FC<React.PropsWithChildren<ReleaseSidePanelBodyProps>> = ({
  workflowNode,
  onClose,
}) => {
  const namespace = useNamespace();
  const workflowData = workflowNode.getData();
  const release = workflowData.resource;

  return (
    <>
      <div className="commit-side-panel__head">
        <DrawerHead data-test="release-side-panel-head">
          <span className="commit-side-panel__head-title">
            {release ? workflowNode.getLabel() : 'Release'}
            {release ? <StatusIconWithTextLabel status={workflowNode.getData().status} /> : null}
          </span>
          <span className="pf-v5-u-mt-xs commit-side-panel__subtext">
            <PipelineIcon role="img" aria-label="Pipeline run" /> Release
          </span>
          <DrawerActions>
            <DrawerCloseButton onClick={onClose} />
          </DrawerActions>
        </DrawerHead>
        <DrawerPanelBody data-test="release-side-panel-body">
          <DescriptionList
            data-test="pipeline-run-details"
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              {!release ? <DescriptionListTerm>No releases set</DescriptionListTerm> : null}
              <DescriptionListDescription>{RELEASE_DESC}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListDescription>
                <Link
                  to={PIPELINE_RUNS_LIST_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: workflowData.application,
                  })}
                >
                  View pipeline runs
                </Link>
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </DrawerPanelBody>
      </div>
    </>
  );
};

export default ReleaseSidePanel;
