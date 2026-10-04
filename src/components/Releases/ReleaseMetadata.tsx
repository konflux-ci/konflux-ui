import { ReactNode } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  Title,
} from '@patternfly/react-core';
import MetadataList from '~/components/MetadataList';
import { StatusIconWithText } from '~/components/StatusIcon/StatusIcon';
import { useReleaseStatus } from '~/hooks/useReleaseStatus';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { ReleaseKind } from '~/types';
import { calculateDuration } from '~/utils/pipeline-utils';

type Props = { release: ReleaseKind; namespace: string; component: ReactNode; snapshot: ReactNode };
const ReleaseMetadata = ({ release, namespace, component, snapshot }: Props) => {
  const status = useReleaseStatus(release);
  const duration = calculateDuration(
    typeof release.status?.startTime === 'string' ? release.status?.startTime : '',
    typeof release.status?.completionTime === 'string' ? release.status?.completionTime : '',
  );

  return (
    <>
      <Title headingLevel="h4" className="pf-v6-c-title pf-v6-u-mt-lg pf-v6-u-mb-lg" size="lg">
        Release details
      </Title>
      <Flex className="pf-v6-u-py-lg">
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
              <DescriptionListGroup>
                <DescriptionListTerm>Component</DescriptionListTerm>
                <DescriptionListDescription>{component}</DescriptionListDescription>
              </DescriptionListGroup>
              {release.spec.snapshot && (
                <DescriptionListGroup>
                  <DescriptionListTerm>Snapshot</DescriptionListTerm>
                  <DescriptionListDescription>{snapshot}</DescriptionListDescription>
                </DescriptionListGroup>
              )}
            </DescriptionList>
          </FlexItem>
        </Flex>
      </Flex>
    </>
  );
};

export default ReleaseMetadata;
