import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { ScanStatus } from '~/components/PipelineRun/PipelineRunListView/ScanStatus';
import SnapshotMetadata from '~/components/SnapshotDetails/SnapshotMetadata';
import GroupSnapshotComponentsList from '~/components/SnapshotDetails/tabs/GroupSnapshotComponentsList';
import { SnapshotLabels } from '~/consts/snapshots';
import { usePipelineRunV2 } from '~/hooks/usePipelineRunsV2';
import { useScanResults } from '~/hooks/useScanResults';
import { useScrollToHash } from '~/hooks/useScrollToHash';
import { useSnapshot } from '~/hooks/useSnapshots';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { createCommitObjectFromPLR } from '~/utils/commits-utils';

const GroupSnapshotOverview: React.FC = () => {
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
              {commit.displayName || commit.shaTitle}{' '}
              <CommitLabel
                gitProvider={commit.gitProvider}
                sha={commit.sha}
                shaURL={commit.shaURL}
              />
            </>
          )
        }
        vulnerabilities={
          !buildPipelineName ? (
            '-'
          ) : scanError ? (
            getErrorState(scanError, loaded, 'vulnerability scan', true)
          ) : scanLoaded ? (
            <ScanStatus scanResults={scanResults} />
          ) : (
            <Skeleton />
          )
        }
      />
      <div id="snapshot-components" className="pf-v6-u-mt-lg">
        <GroupSnapshotComponentsList components={snapshot?.spec?.components ?? []} />
      </div>
    </>
  );
};

export default GroupSnapshotOverview;
