import React from 'react';
import { Link } from 'react-router-dom';
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerHead,
  DrawerPanelBody,
  Tab,
  Tabs,
} from '@patternfly/react-core';
import { ElementModel, GraphElement } from '@patternfly/react-topology';
import { PipelineRunKind } from '~/types';
import { getTaskRunDetailsPath } from '~/utils/pipeline-run-routes';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { StatusIconWithTextLabel } from '../../../StatusIcon/StatusIcon';
import TaskRunLogs from '../../../TaskRuns/TaskRunLogs';
import { PipelineRunNodeData } from '../visualization/types';
import TaskRunDetails from './TaskRunDetails';

import './TaskRunPanel.scss';

type Props = {
  onClose: () => void;
  taskNode: GraphElement<ElementModel, PipelineRunNodeData>;
  pipelineRun?: PipelineRunKind;
};

const TaskRunPanel: React.FC<React.PropsWithChildren<Props>> = ({
  taskNode,
  onClose,
  pipelineRun,
}) => {
  const task = taskNode.getData().task;
  const taskRun = taskNode.getData().taskRun;
  const { status } = taskNode.getData();
  const namespace = useNamespace();
  const path = taskRun && getTaskRunDetailsPath(taskRun, namespace, pipelineRun);

  return (
    <>
      <div className="task-run-panel__head">
        <DrawerHead data-id="task-run-panel-head-id">
          <span>
            {path ? <Link to={path}>{task.name}</Link> : task.name}{' '}
            <StatusIconWithTextLabel status={status} />
          </span>
          <DrawerActions>
            <DrawerCloseButton onClick={onClose} />
          </DrawerActions>
        </DrawerHead>
      </div>

      <div className="task-run-panel__tabs">
        <Tabs defaultActiveKey="details" unmountOnExit className="">
          <Tab title="Details" eventKey="details">
            <DrawerPanelBody>
              <TaskRunDetails taskRun={taskRun} status={status} description={task?.description} />
            </DrawerPanelBody>
          </Tab>
          <Tab title="Logs" eventKey="logs">
            <DrawerPanelBody style={{ height: '100%' }}>
              <TaskRunLogs
                taskRun={taskRun}
                namespace={taskNode.getData().namespace}
                status={status}
              />
            </DrawerPanelBody>
          </Tab>
        </Tabs>
      </div>
    </>
  );
};

export default TaskRunPanel;
