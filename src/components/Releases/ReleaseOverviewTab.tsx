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
import {
  APPLICATION_LIST_PATH,
  PIPELINE_RUNS_DETAILS_PATH,
  SNAPSHOT_DETAILS_PATH,
} from '@routes/paths';
import { useReleasePlan } from '../../hooks/useReleasePlans';
import { useRelease } from '../../hooks/useReleases';
import { useReleaseStatus } from '../../hooks/useReleaseStatus';
import { RouterParams } from '../../routes/utils';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace, useNamespaceInfo } from '../../shared/providers/Namespace';
import { ReleaseKind } from '../../types/release';
import { calculateDuration } from '../../utils/pipeline-utils';
import MetadataList from '../MetadataList';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';

const getPipelineRunFromRelease = (release: ReleaseKind): string => {
  // backward compatibility until https://issues.redhat.com/browse/RELEASE-1109 is released.
  return release.status?.processing?.pipelineRun ?? release.status?.managedProcessing?.pipelineRun;
};

const getNamespaceAndPRName = (
  pipelineRunObj: string,
): [namespace?: string, pipelineRun?: string] => {
  return pipelineRunObj
    ? (pipelineRunObj.split('/').slice(0, 2) as [string?, string?])
    : [undefined, undefined];
};

const ReleaseOverviewTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const { namespaces } = useNamespaceInfo();
  const [release] = useRelease(namespace, releaseName);
  const [prNamespace, pipelineRun] = getNamespaceAndPRName(getPipelineRunFromRelease(release));
  const [releasePlan, releasePlanLoaded] = useReleasePlan(namespace, release.spec.releasePlan);
  const duration = calculateDuration(
    typeof release.status?.startTime === 'string' ? release.status?.startTime : '',
    typeof release.status?.completionTime === 'string' ? release.status?.completionTime : '',
  );
  const status = useReleaseStatus(release);
  const releaseNamespace = React.useMemo(() => {
    return namespaces.map((obj) => obj.metadata.name).includes(prNamespace)
      ? prNamespace
      : namespace;
  }, [namespaces, namespace, prNamespace]);

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
              <DescriptionListGroup>
                <DescriptionListTerm>Release Target</DescriptionListTerm>
                <DescriptionListDescription>
                  <>{release.status?.target ?? '-'}</>
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Pipeline Run</DescriptionListTerm>
                <DescriptionListDescription>
                  {pipelineRun && prNamespace && releasePlanLoaded ? (
                    <Link
                      to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                        workspaceName: prNamespace,
                        applicationName: releasePlan.spec.application,
                        pipelineRunName: pipelineRun,
                      })}
                    >
                      {pipelineRun}
                    </Link>
                  ) : (
                    <Link
                      to={APPLICATION_LIST_PATH.createPath({ workspaceName: releaseNamespace })}
                    >
                      {releaseNamespace}
                    </Link>
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
