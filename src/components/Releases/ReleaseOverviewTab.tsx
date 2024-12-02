import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Spinner,
  Title,
} from '@patternfly/react-core';
import { useReleasePlan } from '../../hooks/useReleasePlans';
import { useRelease } from '../../hooks/useReleases';
import { useReleaseStatus } from '../../hooks/useReleaseStatus';
import { useWorkspaceResource } from '../../hooks/useWorkspaceResource';
import { RouterParams } from '../../routes/utils';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { ReleaseKind } from '../../types/release';
import { calculateDuration } from '../../utils/pipeline-utils';
import MetadataList from '../MetadataList';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';

const getPipelineRunFromRelease = (release: ReleaseKind): string => {
  // backward compatibility until https://issues.redhat.com/browse/RELEASE-1109 is released.
  return release.status?.processing?.pipelineRun ?? release.status?.managedProcessing?.pipelineRun;
};

const ReleaseOverviewTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const { namespace, workspace } = useWorkspaceInfo();
  const [release] = useRelease(workspace, namespace, releaseName);
  const [pipelineRun, prWorkspace] = useWorkspaceResource(getPipelineRunFromRelease(release));
  const [releasePlan, releasePlanLoaded] = useReleasePlan(
    namespace,
    workspace,
    release.spec.releasePlan,
  );
  const duration = calculateDuration(
    typeof release.status?.startTime === 'string' ? release.status?.startTime : '',
    typeof release.status?.completionTime === 'string' ? release.status?.completionTime : '',
  );
  const status = useReleaseStatus(release);

  if (!releasePlanLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <>
      <Title headingLevel="h4" className="pf-v5-c-title pf-v5-u-mt-lg pf-v5-u-mb-lg" size="lg">
        Release details
      </Title>
      <Flex className="pf-v5-u-py-lg">
        <FlexItem flex={{ default: 'flex_3' }}>
          <DescriptionList
            data-test="release-details"
            columnModifier={{
              default: '1Col',
            }}
          >
            <DescriptionListGroup>
              <DescriptionListTerm>Labels</DescriptionListTerm>
              <DescriptionListDescription>
                <MetadataList metadata={release.metadata?.labels} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Annotations</DescriptionListTerm>
              <DescriptionListDescription>
                <MetadataList metadata={release.metadata?.annotations} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Created at</DescriptionListTerm>
              <DescriptionListDescription>
                <Timestamp timestamp={release.metadata.creationTimestamp ?? '-'} />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>{duration ?? '-'}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Release Process</DescriptionListTerm>
              <DescriptionListDescription>
                {release.status?.automated ? 'Automatic' : 'Manual'}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </FlexItem>
        <Flex flex={{ default: 'flex_3' }}>
          <FlexItem flex={{ default: 'flex_3' }}>
            <DescriptionList
              data-test="release-details-col-2"
              columnModifier={{
                default: '1Col',
              }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Status</DescriptionListTerm>
                <DescriptionListDescription>
                  <StatusIconWithText
                    status={status}
                    dataTestAttribute={'release-details status'}
                  />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Release Plan</DescriptionListTerm>
                <DescriptionListDescription>{release.spec.releasePlan}</DescriptionListDescription>
              </DescriptionListGroup>
              {release.spec.snapshot && releasePlanLoaded && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Snapshot</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={`/workspaces/${workspace}/applications/${releasePlan.spec.application}/snapshots/${release.spec.snapshot}`}
                    >
                      {release.spec.snapshot}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
              <DescriptionListGroup>
                <DescriptionListTerm>Release Target</DescriptionListTerm>
                <DescriptionListDescription>
                  <>{release.status?.target ?? '-'}</>
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Pipeline Run</DescriptionListTerm>
                <DescriptionListDescription>
                  {pipelineRun && prWorkspace && releasePlanLoaded ? (
                    <Link
                      to={`/workspaces/${prWorkspace}/applications/${releasePlan.spec.application}/pipelineruns/${pipelineRun}`}
                    >
                      {pipelineRun}
                    </Link>
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
    </>
  );
};

export default ReleaseOverviewTab;
