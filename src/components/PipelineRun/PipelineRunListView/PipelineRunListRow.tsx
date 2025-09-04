import React from 'react';
import { Link } from 'react-router-dom';
import { Popover, Skeleton } from '@patternfly/react-core';
import { PipelineRunColumnKeys } from '../../../consts/pipeline';
import { PipelineRunLabel } from '../../../consts/pipelinerun';
import { ScanResults } from '../../../hooks/useScanResults';
import {
  PIPELINE_RUNS_DETAILS_PATH,
  COMPONENT_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '../../../routes/paths';
import ActionMenu from '../../../shared/components/action-menu/ActionMenu';
import { RowFunctionArgs, TableData } from '../../../shared/components/table';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { TriggerColumnData } from '../../../shared/components/trigger-column-data/trigger-column-data';
import { useNamespace } from '../../../shared/providers/Namespace';
import { PipelineRunKind } from '../../../types';
import { ReleaseKind, ReleasePlanKind } from '../../../types/coreBuildService';
import { createCommitObjectFromPLR } from '../../../utils/commits-utils';
import {
  calculateDuration,
  getPipelineRunStatusResults,
  pipelineRunStatus,
  taskTestResultStatus,
} from '../../../utils/pipeline-utils';
import { StatusIconWithText } from '../../StatusIcon/StatusIcon';
import { usePipelinerunActions } from './pipelinerun-actions';
import { pipelineRunTableColumnClasses, getDynamicColumnClasses } from './PipelineRunListHeader';
import { ScanStatus } from './ScanStatus';

type PipelineRunListRowProps = RowFunctionArgs<
  PipelineRunKind,
  {
    vulnerabilities: { [key: string]: ScanResults };
    fetchedPipelineRuns: string[];
    error?: unknown;
    releasePlan?: ReleasePlanKind;
    release?: ReleaseKind;
    releaseName?: string;
    integrationTestName?: string;
  }
>;

type BasePipelineRunListRowProps = PipelineRunListRowProps & {
  showVulnerabilities?: boolean;
  showWorkspace?: boolean;
  showTestResult?: boolean;
  showSnapshot?: boolean;
  showComponent?: boolean;
  showReference?: boolean;
  showTrigger?: boolean;
};

export enum PipelineRunEventTypeLabel {
  push = 'Push',
  pull_request = 'Pull Request',
  incoming = 'Incoming',
  'retest-all-comment' = 'Retest All Comment',
}

const BasePipelineRunListRow: React.FC<React.PropsWithChildren<BasePipelineRunListRowProps>> = ({
  obj,
  showVulnerabilities,
  showWorkspace,
  showTestResult,
  showSnapshot,
  showComponent,
  showTrigger,
  showReference,
  customData,
}) => {
  const namespace = useNamespace();
  const capitalize = (label: string) => {
    return label && label.charAt(0).toUpperCase() + label.slice(1);
  };
  const { releaseName, integrationTestName, releasePlan, release } = customData || {};
  // @ts-expect-error vulnerabilities will not be available until fetched for the next page
  const [vulnerabilities] = customData?.vulnerabilities?.[obj.metadata.name] ?? [];
  const scanLoaded = (customData?.fetchedPipelineRuns || []).includes(obj.metadata.name);
  const scanResults = scanLoaded ? vulnerabilities || {} : undefined;

  const status = pipelineRunStatus(obj);
  const actions = usePipelinerunActions(obj);
  if (!obj.metadata?.labels) {
    obj.metadata.labels = {};
  }
  const labels = obj.metadata.labels;
  const applicationName = labels?.[PipelineRunLabel.APPLICATION];
  const commit = createCommitObjectFromPLR(obj);

  const testStatus = React.useMemo(() => {
    const results = getPipelineRunStatusResults(obj);
    return taskTestResultStatus(results);
  }, [obj]);

  const queryString = releaseName
    ? `?releaseName=${encodeURIComponent(releaseName)}`
    : integrationTestName
      ? `?integrationTestName=${encodeURIComponent(integrationTestName)}`
      : '';

  return (
    <>
      <TableData className={pipelineRunTableColumnClasses.name}>
        <Link
          to={`${PIPELINE_RUNS_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName,
            pipelineRunName: obj.metadata?.name,
          })}${queryString}`}
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
      ) : showSnapshot ? (
        <TableData className={pipelineRunTableColumnClasses.snapshot}>-</TableData>
      ) : null}
      {showWorkspace ? (
        <TableData className={pipelineRunTableColumnClasses.workspace}>{namespace}</TableData>
      ) : null}
      {showComponent ? (
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
      {showTrigger ? (
        <TableData className={pipelineRunTableColumnClasses.trigger}>
          {PipelineRunEventTypeLabel[commit?.eventType] ?? '-'}
        </TableData>
      ) : null}
      {showReference ? (
        <TableData className={pipelineRunTableColumnClasses.reference}>
          <TriggerColumnData
            repoOrg={commit?.repoOrg}
            repoName={commit?.repoName}
            repoURL={commit?.repoURL}
            prNumber={commit?.pullRequestNumber}
            eventType={commit?.eventType}
            commitSha={commit?.sha}
            shaUrl={commit?.shaURL}
          />
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
) => <BasePipelineRunListRow {...props} showComponent showTestResult showReference showTrigger />;

export const PipelineRunListRowWithVulnerabilities: React.FC<
  React.PropsWithChildren<PipelineRunListRowProps>
> = (props) => <BasePipelineRunListRow {...props} showVulnerabilities showTrigger showReference />;

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

type PipelineRunListRowWithColumnsProps = PipelineRunListRowProps & {
  visibleColumns: Set<PipelineRunColumnKeys>;
};

// Enhanced row component that uses dynamic column classes
const DynamicPipelineRunListRow: React.FC<
  React.PropsWithChildren<PipelineRunListRowWithColumnsProps>
> = ({ obj, customData, visibleColumns }) => {
  const namespace = useNamespace();
  const dynamicClasses = getDynamicColumnClasses(visibleColumns);
  const capitalize = (label: string) => {
    return label && label.charAt(0).toUpperCase() + label.slice(1);
  };
  const { releaseName, integrationTestName, releasePlan, release } = customData || {};
  const [vulnerabilities] = customData?.vulnerabilities?.[obj.metadata.name] ?? [];
  const scanLoaded = (customData?.fetchedPipelineRuns || []).includes(obj.metadata.name);
  const scanResults = scanLoaded ? vulnerabilities || {} : undefined;

  const status = pipelineRunStatus(obj);
  const actions = usePipelinerunActions(obj);
  if (!obj.metadata?.labels) {
    obj.metadata.labels = {};
  }
  const labels = obj.metadata.labels;
  const applicationName = labels?.[PipelineRunLabel.APPLICATION];
  const commit = createCommitObjectFromPLR(obj);

  const testStatus = React.useMemo(() => {
    const results = getPipelineRunStatusResults(obj);
    return taskTestResultStatus(results);
  }, [obj]);

  const queryString = releaseName
    ? `?releaseName=${encodeURIComponent(releaseName)}`
    : integrationTestName
      ? `?integrationTestName=${encodeURIComponent(integrationTestName)}`
      : '';

  return (
    <>
      {visibleColumns.has('name') && (
        <TableData className={dynamicClasses.name}>
          <Link
            to={`${PIPELINE_RUNS_DETAILS_PATH.createPath({
              workspaceName: namespace,
              applicationName,
              pipelineRunName: obj.metadata?.name,
            })}${queryString}`}
            title={obj.metadata?.name}
          >
            {obj.metadata?.name}
          </Link>
        </TableData>
      )}
      {visibleColumns.has('started') && (
        <TableData className={dynamicClasses.started}>
          <Timestamp
            timestamp={typeof obj.status?.startTime === 'string' ? obj.status?.startTime : ''}
          />
        </TableData>
      )}
      {visibleColumns.has('vulnerabilities') && (
        <TableData data-test="vulnerabilities" className={dynamicClasses.vulnerabilities}>
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
      )}
      {visibleColumns.has('duration') && (
        <TableData className={dynamicClasses.duration}>
          {status !== 'Pending'
            ? calculateDuration(
                typeof obj.status?.startTime === 'string' ? obj.status?.startTime : '',
                typeof obj.status?.completionTime === 'string' ? obj.status?.completionTime : '',
              )
            : '-'}
        </TableData>
      )}
      {visibleColumns.has('status') && (
        <TableData className={dynamicClasses.status}>
          <StatusIconWithText status={status} />
        </TableData>
      )}
      {visibleColumns.has('testResult') && (
        <TableData className={dynamicClasses.testResultStatus}>
          <Popover
            triggerAction="hover"
            aria-label="error popover"
            bodyContent={testStatus?.note}
            isVisible={testStatus?.note ? undefined : false}
          >
            <div>{testStatus?.result ? testStatus.result : '-'}</div>
          </Popover>
        </TableData>
      )}
      {visibleColumns.has('type') && (
        <TableData className={dynamicClasses.type}>
          {capitalize(obj.metadata?.labels[PipelineRunLabel.PIPELINE_TYPE])}
        </TableData>
      )}

      {visibleColumns.has('snapshot') && (
        <TableData className={dynamicClasses.snapshot}>
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
      )}
      {visibleColumns.has('snapshot') &&
        (!release?.spec?.snapshot || !releasePlan?.spec?.application) && (
          <TableData className={dynamicClasses.snapshot}>-</TableData>
        )}
      {visibleColumns.has('namespace') && (
        <TableData className={dynamicClasses.workspace}>{namespace}</TableData>
      )}
      {visibleColumns.has('component') && (
        <TableData className={dynamicClasses.component}>
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
      )}
      {visibleColumns.has('trigger') && (
        <TableData className={dynamicClasses.trigger}>
          {PipelineRunEventTypeLabel[commit?.eventType] ?? '-'}
        </TableData>
      )}
      {visibleColumns.has('reference') && (
        <TableData className={dynamicClasses.reference}>
          <TriggerColumnData
            repoOrg={commit?.repoOrg}
            repoName={commit?.repoName}
            repoURL={commit?.repoURL}
            prNumber={commit?.pullRequestNumber}
            eventType={commit?.eventType}
            commitSha={commit?.sha}
            shaUrl={commit?.shaURL}
          />
        </TableData>
      )}
      <TableData data-test="plr-list-row-kebab" className={dynamicClasses.kebab}>
        <ActionMenu actions={actions} />
      </TableData>
    </>
  );
};

// New row component that works with visible columns - now uses dynamic classes
export const PipelineRunListRowWithColumns: React.FC<
  React.PropsWithChildren<PipelineRunListRowWithColumnsProps>
> = (props) => <DynamicPipelineRunListRow {...props} />;
