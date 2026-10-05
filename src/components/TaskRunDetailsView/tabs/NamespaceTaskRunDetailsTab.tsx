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
} from '@patternfly/react-core';
import MetadataList from '~/components/MetadataList';
import TaskRunDetails from '~/components/PipelineRun/PipelineRunDetailsView/sidepanels/TaskRunDetails';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useTaskRunV2 } from '~/hooks/useTaskRunsV2';
import {
  COMPONENT_DETAILS_V2_PATH,
  NAMESPACE_PIPELINE_RUN_DETAILS_PATH,
  NAMESPACE_TASK_RUN_DETAILS_PATH,
} from '~/routes/paths';
import { Timestamp } from '~/shared';
import { getTRLogSnippet } from '~/shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { getPipelineRunDetailsPath } from '~/utils/pipeline-run-routes';
import { taskName, taskRunStatus } from '~/utils/pipeline-utils';

const NamespaceTaskRunDetailsTab = () => {
  const { taskRunName, pipelineRunName } = useParams();
  const namespace = useNamespace();
  const [task, loaded, error] = useTaskRunV2(namespace, taskRunName);
  const [parent] = usePipelineRunV2(namespace, pipelineRunName);
  if (!loaded)
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'task run');
  if (!task) return getErrorState({ code: 404 }, true, 'task run');
  const params = { workspaceName: namespace, pipelineRunName, taskRunName };
  const componentName =
    task.metadata.labels?.[PipelineRunLabel.COMPONENT] ||
    parent?.metadata.labels?.[PipelineRunLabel.COMPONENT];
  const status = taskRunStatus(task);
  const snippet = getTRLogSnippet(task);
  const fields = [
    { name: 'Name', value: task.metadata.name },
    { name: 'Namespace', value: namespace },
    { name: 'Labels', value: <MetadataList metadata={task.metadata.labels} /> },
    { name: 'Annotations', value: <MetadataList metadata={task.metadata.annotations} /> },
    { name: 'Created at', value: <Timestamp timestamp={task.metadata.creationTimestamp} /> },
    { name: 'Task', value: taskName(task) },
    { name: 'Status', value: <StatusIconWithText status={status} /> },
    {
      name: 'Pipeline run',
      value: (
        <Link
          to={
            parent
              ? getPipelineRunDetailsPath(parent)
              : NAMESPACE_PIPELINE_RUN_DETAILS_PATH.createPath(params)
          }
        >
          {pipelineRunName}
        </Link>
      ),
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
      name: 'Logs',
      value: (
        <Link to={`${NAMESPACE_TASK_RUN_DETAILS_PATH.createPath(params)}/logs`}>See logs</Link>
      ),
    },
  ];
  return (
    <>
      <Title headingLevel="h4" className="pf-v6-u-my-lg">
        Task run details
      </Title>
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
      </DescriptionList>
      <div className="pf-v6-u-mt-lg">
        <TaskRunDetails taskRun={task} status={status} />
      </div>
    </>
  );
};

export default NamespaceTaskRunDetailsTab;
