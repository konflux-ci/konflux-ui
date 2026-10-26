import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import { COMMIT_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { ScanStatus } from '~/components/PipelineRun/PipelineRunListView/ScanStatus';
import SnapshotMetadata from '~/components/SnapshotDetails/SnapshotMetadata';
import SnapshotComponentsList from '~/components/SnapshotDetails/tabs/SnapshotComponentsList';
import { SnapshotComponentTableData } from '~/components/SnapshotDetails/tabs/SnapshotComponentsListRow';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useScanResults } from '~/hooks/useScanResults';
import { useScrollToHash } from '~/hooks/useScrollToHash';
import { useSnapshot } from '~/hooks/useSnapshots';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { createCommitObjectFromPLR } from '~/utils/commits-utils';

const SnapshotOverviewTab: React.FC = () => {
  const { snapshotName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [snapshot, loaded, loadErr] = useSnapshot(namespace, snapshotName);

  const buildPipelineName = React.useMemo(
    () => loaded && !loadErr && snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL],
    [snapshot, loaded, loadErr],
  );

  const [buildPipelineRun, plrLoaded, plrLoadError] = usePipelineRunV2(
    snapshot?.metadata?.namespace,
    buildPipelineName,
  );

  const commit = React.useMemo(
    () => plrLoaded && !plrLoadError && createCommitObjectFromPLR(buildPipelineRun),
    [plrLoaded, plrLoadError, buildPipelineRun],
  );
  const [scanResults, scanLoaded, scanError] = useScanResults(buildPipelineName);

  const componentsTableData: SnapshotComponentTableData[] = React.useMemo(
    () =>
      snapshot?.spec?.components?.map((component) => {
        return {
          metadata: { uid: component.name, name: component.name },
          application: snapshot?.spec?.application,
          ...component,
        };
      }) || [],
    [snapshot?.spec],
  );

  useScrollToHash({
    loaded: Boolean(loaded),
    loadErr: Boolean(loadErr),
  });

  return (
    <>
      <SnapshotMetadata
        creationTimestamp={snapshot?.metadata?.creationTimestamp}
        triggeredBy={
          commit && (
            <>
              <Link
                to={COMMIT_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  applicationName: snapshot?.spec?.application,
                  commitName: commit.sha,
                })}
                title={commit.displayName || commit.shaTitle}
              >
                {commit.displayName || commit.shaTitle}{' '}
              </Link>{' '}
              <CommitLabel
                gitProvider={commit.gitProvider}
                sha={commit.sha}
                shaURL={commit.shaURL}
              />
            </>
          )
        }
        vulnerabilities={
          scanError ? (
            getErrorState(scanError, loaded, 'vulnerability scan', true)
          ) : scanLoaded ? (
            <ScanStatus scanResults={scanResults} />
          ) : (
            <Skeleton />
          )
        }
      />
      <div id="snapshot-components" className="pf-v6-u-mt-lg">
        <FilterContextProvider filterParams={['name']}>
          <SnapshotComponentsList
            components={componentsTableData}
            applicationName={snapshot?.spec?.application}
          />
        </FilterContextProvider>
      </div>
    </>
  );
};

export default SnapshotOverviewTab;
