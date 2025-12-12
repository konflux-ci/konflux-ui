import React from 'react';
import { Link } from 'react-router-dom';
import ActionMenu from '~/shared/components/action-menu/ActionMenu';
import { downloadTaskRunYaml } from '~/utils/common-utils';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { TASKRUN_DETAILS_PATH } from '../../routes/paths';
import { RowFunctionArgs, TableData } from '../../shared/components/table';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { TaskRunKind } from '../../types/task-run';
import { taskName, taskRunStatus } from '../../utils/pipeline-utils';
import { StatusIconWithText } from '../topology/StatusIcon';
import { taskRunTableColumnClasses } from './TaskRunListHeader';

const TaskRunListRow: React.FC<React.PropsWithChildren<RowFunctionArgs<TaskRunKind>>> = ({
  obj,
}) => {
  const namespace = useNamespace();
  const applicationName = obj.metadata?.labels[PipelineRunLabel.APPLICATION];
  return (
    <>
      <TableData className={taskRunTableColumnClasses.name}>
        <Link
          to={TASKRUN_DETAILS_PATH.createPath({
            applicationName,
            workspaceName: namespace,
            taskRunName: obj.metadata?.name,
          })}
        >
          {obj.metadata.name}
        </Link>
      </TableData>
      <TableData className={taskRunTableColumnClasses.task}>{taskName(obj) ?? '-'}</TableData>
      <TableData className={taskRunTableColumnClasses.started}>
        <Timestamp timestamp={obj.status?.startTime} />
      </TableData>
      <TableData className={taskRunTableColumnClasses.status}>
        <StatusIconWithText dataTestAttribute="taskrun-status" status={taskRunStatus(obj)} />
      </TableData>
      <TableData className={taskRunTableColumnClasses.kebab}>
        <ActionMenu
          actions={[
            {
              id: 'download-task-run-yaml',
              label: 'Download Task Run YAML',
              cta: () => downloadTaskRunYaml(obj),
            },
          ]}
        />
      </TableData>
    </>
  );
};

export default TaskRunListRow;
