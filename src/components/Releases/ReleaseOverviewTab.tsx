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
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { getErrorState } from '~/shared/utils/error-utils';
import { useRelease } from '../../hooks/useReleases';
import { useReleaseStatus } from '../../hooks/useReleaseStatus';
import { SNAPSHOT_DETAILS_PATH } from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { calculateDuration } from '../../utils/pipeline-utils';
import MetadataList from '../MetadataList';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';

const ReleaseOverviewTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, loaded, error] = useRelease(namespace, releaseName);
  const status = useReleaseStatus(release);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'release');
  }

  const applicationName = release.metadata.labels[PipelineRunLabel.APPLICATION];
  const duration = calculateDuration(
    typeof release.status?.startTime === 'string' ? release.status?.startTime : '',
    typeof release.status?.completionTime === 'string' ? release.status?.completionTime : '',
  );

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
              <DescriptionListDescription>{release.spec.releasePlan}</DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>
                Release Target {namespace !== release.status?.target ? '(Managed Namespace)' : ''}
              </DescriptionListTerm>
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
              {release.spec.snapshot && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Snapshot</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Link
                      to={SNAPSHOT_DETAILS_PATH.createPath({
                        workspaceName: namespace,
                        applicationName,
                        snapshotName: release.spec.snapshot,
                      })}
                      state={{ type: 'snapshot' }}
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
