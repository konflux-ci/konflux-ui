import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Skeleton,
  Title,
} from '@patternfly/react-core';
import { useNamespace } from '~/shared/providers/Namespace';
import { SnapshotLabels } from '../../../consts/pipelinerun';
import { usePipelineRun } from '../../../hooks/usePipelineRuns';
import { useScanResults } from '../../../hooks/useScanResults';
import { useSnapshot } from '../../../hooks/useSnapshots';
import { RouterParams } from '../../../routes/utils';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { createCommitObjectFromPLR } from '../../../utils/commits-utils';
import CommitLabel from '../../Commits/commit-label/CommitLabel';
import { ScanStatus } from '../../PipelineRun/PipelineRunListView/ScanStatus';
import SnapshotComponentsList from './SnapshotComponentsList';
import { SnapshotComponentTableData } from './SnapshotComponentsListRow';

const SnapshotOverviewTab: React.FC = () => {
  const { snapshotName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [snapshot, loaded, loadErr] = useSnapshot(namespace, snapshotName);

  const buildPipelineName = React.useMemo(
    () => loaded && !loadErr && snapshot?.metadata?.labels[SnapshotLabels.BUILD_PIPELINE_LABEL],
    [snapshot, loaded, loadErr],
  );

  const [buildPipelineRun, plrLoaded, plrLoadError] = usePipelineRun(
    snapshot?.metadata?.namespace,
    // temporary until pipelines are migrated
    namespace,
    buildPipelineName,
  );

  const commit = React.useMemo(
    () => plrLoaded && !plrLoadError && createCommitObjectFromPLR(buildPipelineRun),
    [plrLoaded, plrLoadError, buildPipelineRun],
  );
  const [scanResults, scanLoaded] = useScanResults(buildPipelineName);

  const componentsTableData: SnapshotComponentTableData[] = React.useMemo(
    () =>
      snapshot.spec.components.map((component) => {
        return {
          metadata: { uid: component.name, name: component.name },
          application: snapshot.spec.application,
          ...component,
        };
      }),
    [snapshot.spec],
  );

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg" size="lg">
        Snapshot details
      </Title>
      <Flex>
        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem>
            <DescriptionList
              data-test="snapshot-details"
              columnModifier={{
                default: '1Col',
              }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Created at</DescriptionListTerm>
                <DescriptionListDescription>
                  <Timestamp timestamp={snapshot.metadata.creationTimestamp ?? '-'} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              {commit && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Triggered by</DescriptionListTerm>
                  <DescriptionListDescription data-test="snapshot-commit-link">
                    <Link
                      to={`/workspaces/${namespace}/applications/${snapshot.spec.application}/commit/${commit.sha}`}
                      title={commit.displayName || commit.shaTitle}
                    >
                      {commit.displayName || commit.shaTitle}{' '}
                      <CommitLabel
                        gitProvider={commit.gitProvider}
                        sha={commit.sha}
                        shaURL={commit.shaURL}
                      />
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </FlexItem>
        </Flex>

        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem>
            <DescriptionList
              data-test="snapshot-details"
              columnModifier={{
                default: '1Col',
              }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Vulnerabilities</DescriptionListTerm>
                <DescriptionListDescription>
                  {scanLoaded ? <ScanStatus scanResults={scanResults} /> : <Skeleton />}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
      <div className="pf-vf-u-mt-lg">
        <SnapshotComponentsList
          components={componentsTableData}
          applicationName={snapshot.spec.application}
        />
      </div>
    </>
  );
};

export default SnapshotOverviewTab;
