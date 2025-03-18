import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Popover } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import {
  Node,
  observer,
  PipelineNodeModel,
  TaskNode,
  useCombineRefs,
  useHover,
} from '@patternfly/react-topology';
import { useNamespace } from '~/shared/providers/Namespace';
import { runStatusToRunStatus } from '../../../../../topology/utils';
import { WorkflowNodeModelData } from '../types';
import { getWorkflowNodeIcon } from '../utils/node-icon-utils';
import { getLinksForElement } from '../utils/node-utils';
import WorkflowNodeTipContent from './WorkflowNodeTipContent';

import './WorkflowNode.scss';

type WorkflowNodeProps = {
  element: Node<PipelineNodeModel, WorkflowNodeModelData>;
};

const WorkflowNode: React.FC<React.PropsWithChildren<WorkflowNodeProps>> = ({ element }) => {
  const navigate = useNavigate();
  const namespace = useNamespace();
  const [tipHover, setTipHover] = React.useState<boolean>(false);
  const [tipVisible, setTipVisible] = React.useState<boolean>(false);
  const [hover, hoverRef] = useHover();
  const { isDisabled, workflowType, status, children, hidden } = element.getData();
  const childNodes = children?.filter((n) => !n.data.isDisabled) || [];
  const triggerRef = React.useRef<Element>();
  const outerRef = useCombineRefs(hoverRef, triggerRef);

  const setActiveTab = React.useCallback(() => {
    navigate(getLinksForElement(element, namespace).elementRef);
  }, [element, navigate, namespace]);

  React.useEffect(() => {
    let canceled = false;
    if (tipHover || hover) {
      setTipVisible(true);
    } else {
      setTimeout(() => {
        if (!canceled) {
          setTipVisible(false);
        }
      }, 500);
    }
    return () => {
      canceled = true;
    };
  }, [hover, tipHover]);

  if (hidden) {
    return null;
  }

  return (
    <Popover
      isVisible={tipVisible}
      className="workload-node__popover"
      showClose={false}
      triggerRef={triggerRef}
      bodyContent={
        <div onMouseEnter={() => setTipHover(true)} onMouseLeave={() => setTipHover(false)}>
          <WorkflowNodeTipContent element={element} />
        </div>
      }
      appendTo={() => document.querySelector('#hacDev-modal-container')}
    >
      <g ref={outerRef}>
        <TaskNode
          truncateLength={element.getLabel().length}
          element={element}
          showStatusState
          statusIconSize={18}
          status={status ? runStatusToRunStatus(status) : undefined}
          hover={isDisabled ? false : undefined}
          badge={childNodes.length ? `${childNodes.length}` : undefined}
          className={css('workload-node', { 'm-disabled': isDisabled })}
          taskIcon={getWorkflowNodeIcon(workflowType)}
          paddingY={6}
          onSelect={setActiveTab}
        />
      </g>
    </Popover>
  );
};

export default observer(WorkflowNode);
