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
  Flex,
  FlexItem,
} from '@patternfly/react-core';
import MetadataList from '~/components/MetadataList';
import RunParamsList from '~/components/PipelineRun/PipelineRunDetailsView/tabs/RunParamsList';
import RunResultsList from '~/components/PipelineRun/PipelineRunDetailsView/tabs/RunResultsList';
import ScanDescriptionListGroup from '~/components/PipelineRun/PipelineRunDetailsView/tabs/ScanDescriptionListGroup';
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
import { SyncMarkdownView } from '~/shared/components/markdown-view/MarkdownView';
import { getTRLogSnippet } from '~/shared/components/pipeline-run-logs/logs/pipelineRunLogSnippet';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { getPipelineRunDetailsPath } from '~/utils/pipeline-run-routes';
import { calculateDuration, isTaskV1Beta1, taskName, taskRunStatus } from '~/utils/pipeline-utils';

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
  const results = isTaskV1Beta1(task) ? task.status?.taskResults : task.status?.results;
  const duration =
    typeof task.status?.startTime === 'string' && task.status.startTime
      ? calculateDuration(
          task.status.startTime,
          typeof task.status.completionTime === 'string' ? task.status.completionTime : undefined,
        )
      : undefined;
  const metadataFields = [
    { name: 'Name', value: task.metadata.name },
    { name: 'Namespace', value: namespace },
    { name: 'Labels', value: <MetadataList metadata={task.metadata.labels} /> },
    { name: 'Annotations', value: <MetadataList metadata={task.metadata.annotations} /> },
    { name: 'Created at', value: <Timestamp timestamp={task.metadata.creationTimestamp} /> },
    { name: 'Duration', value: duration },
  ];
  const relatedFields = [
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
  ];
  return (
    <>
      <Title headingLevel="h4" className="pf-v6-u-my-lg">
        Task run details
      </Title>
      <Flex>
        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem>
            <DescriptionList columnModifier={{ default: '1Col' }}>
              {metadataFields.map(({ name, value }) => (
                <DescriptionListGroup key={name}>
                  <DescriptionListTerm>{name}</DescriptionListTerm>
                  <DescriptionListDescription>{value || '-'}</DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </FlexItem>
        </Flex>
        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem>
            <DescriptionList columnModifier={{ default: '1Col' }}>
              {taskName(task) && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Task</DescriptionListTerm>
                  <DescriptionListDescription>{taskName(task)}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Description</DescriptionListTerm>
                <DescriptionListDescription>
                  <SyncMarkdownView content={task.status?.taskSpec?.description || '-'} inline />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <StatusIconWithText status={status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <ScanDescriptionListGroup taskRuns={[task]} hideIfNotFound />
              {snippet && (
                <>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Message</DescriptionListTerm>
                    <DescriptionListDescription>{snippet.title}</DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>Log snippet</DescriptionListTerm>
                    <DescriptionListDescription>
                      <CodeBlock>
                        <CodeBlockCode>
                          {'staticMessage' in snippet ? snippet.staticMessage : '-'}
                        </CodeBlockCode>
                      </CodeBlock>
                      <Link to={`${NAMESPACE_TASK_RUN_DETAILS_PATH.createPath(params)}/logs`}>
                        See logs
                      </Link>
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </>
              )}
              {relatedFields.map(({ name, value }) => (
                <DescriptionListGroup key={name}>
                  <DescriptionListTerm>{name}</DescriptionListTerm>
                  <DescriptionListDescription>{value || '-'}</DescriptionListDescription>
                </DescriptionListGroup>
              ))}
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
      {!!results?.length && (
        <div className="pf-v6-u-mt-lg">
          <RunResultsList results={results} status={status} />
        </div>
      )}
      {!!task.spec.params?.length && (
        <div className="pf-v6-u-mt-lg">
          <RunParamsList params={task.spec.params} />
        </div>
      )}
    </>
  );
};

export default NamespaceTaskRunDetailsTab;
