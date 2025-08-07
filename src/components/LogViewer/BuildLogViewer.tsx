import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  ModalVariant,
} from '@patternfly/react-core';
import dayjs from 'dayjs';
import { PIPELINERUN_DETAILS_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { useLatestBuildPipelineRunForComponent } from '../../hooks/usePipelineRuns';
import { useTaskRuns } from '../../hooks/useTaskRuns';
import PipelineRunLogs from '../../shared/components/pipeline-run-logs/PipelineRunLogs';
import { EmptyBox, LoadingBox } from '../../shared/components/status-box/StatusBox';
import { ComponentKind } from '../../types';
import { pipelineRunStatus } from '../../utils/pipeline-utils';
import { ComponentProps, createModalLauncher } from '../modal/createModalLauncher';
import { useModalLauncher } from '../modal/ModalProvider';
import { StatusIconWithTextLabel } from '../topology/StatusIcon';

import './BuildLogViewer.scss';

type BuildLogViewerProps = ComponentProps & {
  component: ComponentKind;
};

export const BuildLogViewer: React.FC<React.PropsWithChildren<BuildLogViewerProps>> = ({
  component,
}) => {
  const namespace = useNamespace();
  const [pipelineRun, loaded, pipelineRunError] = useLatestBuildPipelineRunForComponent(
    component.metadata.namespace,
    component.metadata.name,
  );
  const [taskRuns, taskRunsLoaded, taskRunsError] = useTaskRuns(
    pipelineRun?.metadata?.namespace,
    pipelineRun?.metadata?.name,
  );
  const plrStatus = React.useMemo(
    () => loaded && pipelineRun && pipelineRunStatus(pipelineRun),
    [loaded, pipelineRun],
  );

  if (!loaded) {
    return <LoadingBox />;
  }

  if (pipelineRunError) {
    return getErrorState(pipelineRunError, loaded, 'pipeline run');
  }

  if (!pipelineRun) {
    return <EmptyBox label="pipeline runs" />;
  }

  return (
    <>
      <div className="pf-v5-c-modal-box__title build-log-viewer__title">
        <span className="pf-v5-c-modal-box__title-text">{`Build pipeline run log for ${component.metadata.name}`}</span>
        <StatusIconWithTextLabel status={plrStatus} />
      </div>
      <div>
        <DescriptionList
          data-test="pipeline-run-details"
          columnModifier={{
            default: '3Col',
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Component</DescriptionListTerm>
            <DescriptionListDescription>{component.metadata.name}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Build pipeline run</DescriptionListTerm>
            <DescriptionListDescription>
              {pipelineRun && loaded && (
                <Link
                  to={PIPELINERUN_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName: component.spec.application,
                    pipelineRunName: pipelineRun.metadata?.name,
                  })}
                  title={pipelineRun.metadata?.name}
                >
                  {pipelineRun.metadata?.name}
                </Link>
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Build start date</DescriptionListTerm>
            <DescriptionListDescription>
              {pipelineRun &&
                loaded &&
                dayjs(new Date(pipelineRun.metadata.creationTimestamp)).format(
                  'MMMM DD, YYYY, h:mm A',
                )}
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </div>
      <div className="build-log-viewer__body">
        {!(pipelineRun && taskRunsLoaded) ? (
          <LoadingBox />
        ) : taskRunsError ? (
          getErrorState(taskRunsError, taskRunsLoaded, 'task runs')
        ) : (
          <PipelineRunLogs obj={pipelineRun} taskRuns={taskRuns} />
        )}
      </div>
    </>
  );
};

export const buildLogViewerLauncher = createModalLauncher(BuildLogViewer, {
  className: 'build-log-viewer',
  'data-test': 'view-build-logs-modal',
  variant: ModalVariant.large,
});

export const useBuildLogViewerModal = (component: ComponentKind) => {
  const showModal = useModalLauncher();
  return React.useCallback(
    () => showModal(buildLogViewerLauncher({ component })),
    [component, showModal],
  );
};
