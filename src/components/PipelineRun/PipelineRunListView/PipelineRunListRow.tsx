import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Popover, Skeleton } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { useReleasePlan } from '../../../hooks/useReleasePlans';
import { useRelease } from '../../../hooks/useReleases';
import { ScanResults } from '../../../hooks/useScanResults';
import {
  PIPELINE_RUNS_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { RowFunctionArgs, TableData } from '../../../shared/components/table';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import {
  calculateDuration,
  getPipelineRunStatusResults,
  pipelineRunStatus,
  taskTestResultStatus,
} from '../../../utils/pipeline-utils';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { usePipelinerunActions } from './pipelinerun-actions';
import { pipelineRunTableColumnClasses } from './PipelineRunListHeader';
import { ScanStatus } from './ScanStatus';

type PipelineRunListRowProps = RowFunctionArgs<
  PipelineRunKind,
  {
    vulnerabilities: { [key: string]: ScanResults };
    fetchedPipelineRuns: string[];
    error?: unknown;
  }
>;

type BasePipelineRunListRowProps = PipelineRunListRowProps & {
  showVulnerabilities?: boolean;
  showWorkspace?: boolean;
  showTestResult?: boolean;
  showSnapshot?: boolean;
  showComponent?: boolean;
};

const BasePipelineRunListRow: React.FC<React.PropsWithChildren<BasePipelineRunListRowProps>> = ({
  obj,
  showVulnerabilities,
  showWorkspace,
  showTestResult,
  showSnapshot,
  showComponent,
  customData,
}) => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release] = useRelease(namespace, releaseName);
  const [releasePlan] = useReleasePlan(namespace, release?.spec?.releasePlan);
  const capitalize = (label: string) => {
    return label && label.charAt(0).toUpperCase() + label.slice(1);
  };
  // @ts-expect-error vulnerabilities will not be available until fetched for the next page
  const [vulnerabilities] = customData?.vulnerabilities?.[obj.metadata.name] ?? [];
  const scanLoaded = (customData?.fetchedPipelineRuns || []).includes(obj.metadata.name);
  const scanResults = scanLoaded ? vulnerabilities || {} : undefined;

  const status = pipelineRunStatus(obj);
  const actions = usePipelinerunActions(obj);
  if (!obj.metadata?.labels) {
    obj.metadata.labels = {};
  }
  const applicationName = obj.metadata?.labels[PipelineRunLabel.APPLICATION];

  const testStatus = React.useMemo(() => {
    const results = getPipelineRunStatusResults(obj);
    return taskTestResultStatus(results);
  }, [obj]);

  return (
    <>
      <TableData className={pipelineRunTableColumnClasses.name}>
        <Link
          to={PIPELINE_RUNS_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            pipelineRunName: obj.metadata?.name,
          })}
          title={obj.metadata?.name}
        >
          {obj.metadata?.name}
        </Link>
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.started}>
        <Timestamp
          timestamp={typeof obj.status?.startTime === 'string' ? obj.status?.startTime : ''}
        />
      </TableData>
      {showVulnerabilities ? (
        <TableData
          data-test="vulnerabilities"
          className={pipelineRunTableColumnClasses.vulnerabilities}
        >
          {customData?.error ? (
            <>N/A</>
          ) : !obj?.status?.completionTime ? (
            '-'
          ) : scanLoaded ? (
            <ScanStatus scanResults={scanResults} />
          ) : (
            <Skeleton />
          )}
        </TableData>
      ) : null}
      <TableData className={pipelineRunTableColumnClasses.duration}>
        {status !== 'Pending'
          ? calculateDuration(
              typeof obj.status?.startTime === 'string' ? obj.status?.startTime : '',
              typeof obj.status?.completionTime === 'string' ? obj.status?.completionTime : '',
            )
          : '-'}
      </TableData>
      <TableData className={pipelineRunTableColumnClasses.status}>
        <StatusIconWithText status={status} />
      </TableData>
      {showTestResult ? (
        <TableData className={pipelineRunTableColumnClasses.testResultStatus}>
          <Popover
            triggerAction="hover"
            aria-label="error popover"
            bodyContent={testStatus?.note}
            isVisible={testStatus?.note ? undefined : false}
          >
            <div>{testStatus?.result ? testStatus.result : '-'}</div>
          </Popover>
        </TableData>
      ) : null}
      <TableData className={pipelineRunTableColumnClasses.type}>
        {capitalize(obj.metadata?.labels[PipelineRunLabel.PIPELINE_TYPE])}
      </TableData>

      {showVulnerabilities ? (
        <TableData className={pipelineRunTableColumnClasses.component}>
          {obj.metadata?.labels[PipelineRunLabel.COMPONENT] ? (
            obj.metadata?.labels[PipelineRunLabel.APPLICATION] ? (
              <Link
                to={COMPONENT_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: obj.metadata?.labels[PipelineRunLabel.APPLICATION],
                  componentName: obj.metadata?.labels[PipelineRunLabel.COMPONENT],
                })}
              >
                {obj.metadata?.labels[PipelineRunLabel.COMPONENT]}
              </Link>
            ) : (
              obj.metadata?.labels[PipelineRunLabel.COMPONENT]
            )
          ) : (
            '-'
          )}
        </TableData>
      ) : null}
      {showSnapshot ? (
        <TableData className={pipelineRunTableColumnClasses.snapshot}>
          <Link
            to={SNAPSHOT_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName: releasePlan.spec.application,
              snapshotName: release.spec.snapshot,
            })}
          >
            {release.spec.snapshot}
          </Link>
        </TableData>
      ) : null}
      {showWorkspace ? (
        <TableData className={pipelineRunTableColumnClasses.workspace}>
          {capitalize(namespace)}
        </TableData>
      ) : null}
      {showComponent ? (
        <TableData className={pipelineRunTableColumnClasses.component}>
          {capitalize(release.metadata.name)}
        </TableData>
      ) : null}

      <TableData data-test="plr-list-row-kebab" className={pipelineRunTableColumnClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

export const PipelineRunListRow: React.FC<React.PropsWithChildren<PipelineRunListRowProps>> = (
  props,
) => <BasePipelineRunListRow {...props} showTestResult showComponent />;

export const PipelineRunListRowWithVulnerabilities: React.FC<
  React.PropsWithChildren<PipelineRunListRowProps>
> = (props) => (
  <BasePipelineRunListRow {...props} showVulnerabilities showTestResult showComponent />
);

export const PipelineRunListRowForRelease: React.FC<
  React.PropsWithChildren<PipelineRunListRowProps>
> = (props) => (
  <BasePipelineRunListRow
    {...props}
    showWorkspace={true}
    showSnapshot={true}
    showVulnerabilities={false}
    showTestResult={false}
    showComponent={false}
  />
);
