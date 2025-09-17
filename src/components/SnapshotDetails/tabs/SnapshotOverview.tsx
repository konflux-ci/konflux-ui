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
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { SnapshotLabels } from '../../../consts/snapshots';
import { usePipelineRun } from '../../../hooks/usePipelineRuns';
import { useScanResults } from '../../../hooks/useScanResults';
import { useScrollToHash } from '../../../hooks/useScrollToHash';
import { useSnapshot } from '../../../hooks/useSnapshots';
import { COMMIT_DETAILS_PATH } from '../../../routes/paths';
import { RouterParams } from '../../../routes/utils';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../../shared/providers/Namespace';
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
    () => loaded && !loadErr && snapshot?.metadata?.labels?.[SnapshotLabels.BUILD_PIPELINE_LABEL],
    [snapshot, loaded, loadErr],
  );

  const [buildPipelineRun, plrLoaded, plrLoadError] = usePipelineRun(
    snapshot?.metadata?.namespace,
    buildPipelineName,
  );

  const commit = React.useMemo(
    () => plrLoaded && !plrLoadError && createCommitObjectFromPLR(buildPipelineRun),
    [plrLoaded, plrLoadError, buildPipelineRun],
  );
  const [scanResults, scanLoaded] = useScanResults(buildPipelineName);

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
                  <Timestamp timestamp={snapshot?.metadata?.creationTimestamp ?? '-'} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              {commit && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Triggered by</DescriptionListTerm>
                  <DescriptionListDescription data-test="snapshot-commit-link">
                    <Link
                      to={COMMIT_DETAILS_PATH.createPath({
                        workspaceName: namespace,
                        applicationName: snapshot?.spec?.application,
                        commitName: commit.sha,
                      })}
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
      <div id="snapshot-components" className="pf-vf-u-mt-lg">
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
