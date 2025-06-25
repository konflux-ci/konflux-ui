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
import { APPLICATION_RELEASE_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { calculateDuration } from '../../utils/pipeline-utils';
import MetadataList from '../MetadataList';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';

const ReleaseOverviewTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release] = useRelease(namespace, releaseName);
  const [releasePlan, releasePlanLoaded] = useReleasePlan(namespace, release.spec.releasePlan);
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
              <DescriptionListTerm>Release Plan</DescriptionListTerm>
              <DescriptionListDescription>
                <Link
                  to={APPLICATION_RELEASE_DETAILS_PATH.createPath({
                    workspaceName: namespace,
                    applicationName,
                    releaseName: release.metadata.name,
                  })}
                >
                  {release.spec.releasePlan}
                </Link>
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Release Target (Managed Namespace)</DescriptionListTerm>
              <DescriptionListDescription>
                <>{release.status?.target ?? '-'}</>
              </DescriptionListDescription>
            </DescriptionListGroup>
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
                <DescriptionListTerm>Release Trigger</DescriptionListTerm>
                <DescriptionListDescription>
                  {release.status?.automated ? 'Automatic' : 'Manual'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              {release.spec.snapshot && releasePlanLoaded && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Snapshot</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={SNAPSHOT_DETAILS_PATH.createPath({
                        workspaceName: namespace,
                        applicationName: releasePlan.spec.application,
                        snapshotName: release.spec.snapshot,
                      })}
                    >
                      {release.spec.snapshot}
                    </Link>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
    </>
  );
};

export default ReleaseOverviewTab;
