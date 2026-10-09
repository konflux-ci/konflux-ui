import React from 'react';
import { Link } from 'react-router-dom';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { PipelineRunKind } from '~/types';
import { downloadYamlAction } from '~/utils/common-utils';
import { getTaskRunDetailsPath } from '~/utils/pipeline-run-routes';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { TaskRunKind } from '../../types/task-run';
import { taskName, taskRunStatus } from '../../utils/pipeline-utils';
import { StatusIconWithText } from '../topology/StatusIcon';
import { taskRunTableColumnClasses } from './TaskRunListHeader';

const TaskRunListRow: React.FC<
  React.PropsWithChildren<RowFunctionArgs<TaskRunKind, { pipelineRun?: PipelineRunKind }>>
> = ({ obj, customData }) => {
  const namespace = useNamespace();
  const path = getTaskRunDetailsPath(obj, namespace, customData?.pipelineRun);
  return (
    <>
      <TableData className={taskRunTableColumnClasses.name}>
        {path ? <Link to={path}>{obj.metadata.name}</Link> : obj.metadata.name}
      </TableData>
      <TableData className={taskRunTableColumnClasses.task}>{taskName(obj) ?? '-'}</TableData>
      <TableData className={taskRunTableColumnClasses.started}>
        <Timestamp timestamp={obj.status?.startTime} />
      </TableData>
      <TableData className={taskRunTableColumnClasses.status}>
        <StatusIconWithText dataTestAttribute="taskrun-status" status={taskRunStatus(obj)} />
      </TableData>
      <TableData className={taskRunTableColumnClasses.kebab}>
        <ActionMenu actions={[downloadYamlAction(obj)]} />
      </TableData>
    </>
  );
};

export default TaskRunListRow;
