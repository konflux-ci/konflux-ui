import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bullseye,
  Text,
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
import { PIPELINE_RUNS_DETAILS_PATH, SNAPSHOT_DETAILS_PATH } from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { Timestamp } from '../../shared/components/timestamp/Timestamp';
import { useNamespace } from '../../shared/providers/Namespace';
import { calculateDuration } from '../../utils/pipeline-utils';
import {
  getNamespaceAndPRName,
  getManagedPipelineRunFromRelease,
  getTenantPipelineRunFromRelease,
  getFinalPipelineRunFromRelease,
  getTenantCollectorPipelineRunFromRelease,
} from '../../utils/release-utils';
import MetadataList from '../MetadataList';
import { StatusIconWithText } from '../StatusIcon/StatusIcon';

const ReleaseOverviewTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release] = useRelease(namespace, releaseName);
  const [managedPrNamespace, managedPipelineRun] = getNamespaceAndPRName(
    getManagedPipelineRunFromRelease(release),
  );
  const [tenantPrNamespace, tenantPipelineRun] = getNamespaceAndPRName(
    getTenantPipelineRunFromRelease(release),
  );
  const [tenantCollectorPrNamespace, tenantCollectorPipelineRun] = getNamespaceAndPRName(
    getTenantCollectorPipelineRunFromRelease(release),
  );
  const [finalPrNamespace, finalPipelineRun] = getNamespaceAndPRName(
    getFinalPipelineRunFromRelease(release),
  );
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
                      state={{ type: 'snapshot' }}
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
                <DescriptionListTerm>Tenant Collector Pipeline Run</DescriptionListTerm>
                <DescriptionListDescription>
                  {tenantCollectorPipelineRun && tenantCollectorPrNamespace ? (
                    <Link
                      to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                        workspaceName: tenantCollectorPrNamespace,
                        applicationName: releasePlan.spec.application,
                        pipelineRunName: tenantCollectorPipelineRun,
                      })}
                    >
                      {tenantCollectorPipelineRun}
                    </Link>
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Tenant Pipeline Run</DescriptionListTerm>
                <DescriptionListDescription>
                  {tenantPipelineRun && tenantPrNamespace && releasePlanLoaded ? (
                    <Link
                      to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                        workspaceName: tenantPrNamespace,
                        applicationName: releasePlan.spec.application,
                        pipelineRunName: tenantPipelineRun,
                      })}
                    >
                      {tenantPipelineRun}
                    </Link>
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Managed Pipeline Run</DescriptionListTerm>
                <DescriptionListDescription>
                  {managedPipelineRun && managedPrNamespace && releasePlanLoaded ? (
                    <Link
                      to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                        workspaceName: managedPrNamespace,
                        applicationName: releasePlan.spec.application,
                        pipelineRunName: managedPipelineRun,
                      })}
                      state={{ type: 'managed' }}
                    >
                      {managedPipelineRun}
                    </Link>
                  ) : (
                    '-'
                  )}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Final Pipeline Run</DescriptionListTerm>
                <DescriptionListDescription>
                  {finalPipelineRun && finalPrNamespace && releasePlanLoaded ? (
                    <Link
                      to={PIPELINE_RUNS_DETAILS_PATH.createPath({
                        workspaceName: finalPrNamespace,
                        applicationName: releasePlan.spec.application,
                        pipelineRunName: finalPipelineRun,
                      })}
                    >
                      {finalPipelineRun}
                    </Link>
                  ) : (
                    <Text>Not available yet</Text>
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
