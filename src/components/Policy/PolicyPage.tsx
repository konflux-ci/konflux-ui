import * as React from 'react';
import {
  Bullseye,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  PageSection,
  PageSectionVariants,
  Spinner,
  Text,
  TextContent,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { global_danger_color_100 as dangerColor } from '@patternfly/react-tokens/dist/js/global_danger_color_100';
import { global_success_color_100 as successColor } from '@patternfly/react-tokens/dist/js/global_success_color_100';
import { global_warning_color_100 as warningColor } from '@patternfly/react-tokens/dist/js/global_warning_color_100';
import PageLayout from '~/components/PageLayout/PageLayout';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { IfFeature } from '~/feature-flags/hooks';
import { logger } from '~/monitoring/logger';
import PolicyConformaTable from './PolicyConformaTable';
import type { PolicyComponentStatus } from './usePolicyConformaResults';
import { usePolicyConformaResults } from './usePolicyConformaResults';

type LabelColor = NonNullable<React.ComponentProps<typeof Label>['color']>;

const componentLabelColor = (status: PolicyComponentStatus['status']): LabelColor => {
  switch (status) {
    case 'fail':
      return 'red';
    case 'warning':
      return 'gold';
    case 'pass':
      return 'green';
    case 'unknown':
    default:
      return 'grey';
  }
};

const ComponentStatusIcon: React.FC<{ status: PolicyComponentStatus['status'] }> = ({
  status,
}) => {
  switch (status) {
    case 'fail':
      return <ExclamationCircleIcon color={dangerColor.value} />;
    case 'warning':
      return <ExclamationTriangleIcon color={warningColor.value} />;
    case 'pass':
      return <CheckCircleIcon color={successColor.value} />;
    case 'unknown':
    default:
      return null;
  }
};

const AggregateCounts: React.FC<{
  totalViolations: number;
  totalWarnings: number;
  totalSuccesses: number;
}> = ({ totalViolations, totalWarnings, totalSuccesses }) => (
  <Flex
    spaceItems={{ default: 'spaceItemsLg' }}
    alignItems={{ default: 'alignItemsCenter' }}
    flexWrap={{ default: 'wrap' }}
  >
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <ExclamationCircleIcon color={dangerColor.value} aria-hidden />
      <FlexItem>{totalViolations}</FlexItem>
    </Flex>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <ExclamationTriangleIcon color={warningColor.value} aria-hidden />
      <FlexItem>{totalWarnings}</FlexItem>
    </Flex>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <CheckCircleIcon color={successColor.value} aria-hidden />
      <FlexItem>{totalSuccesses}</FlexItem>
    </Flex>
  </Flex>
);

const PolicyPageInner: React.FC = () => {
  const {
    componentStatuses,
    allResults,
    totalViolations,
    totalWarnings,
    totalSuccesses,
    loaded,
    error,
  } = usePolicyConformaResults();

  React.useEffect(() => {
    if (error) {
      logger.error(
        'Failed to load policy conforma results',
        error instanceof Error ? error : undefined,
        { error },
      );
    }
  }, [error]);

  if (error) {
    return (
      <PageSection>
        <Text>Unable to load policy data.</Text>
      </PageSection>
    );
  }

  if (!loaded) {
    return (
      <PageSection>
        <Bullseye>
          <Spinner size="xl" aria-label="Loading policy data" />
        </Bullseye>
      </PageSection>
    );
  }

  const isEmpty = componentStatuses.length === 0 && allResults.length === 0;

  if (isEmpty) {
    return (
      <PageSection>
        <Text>No policy data available</Text>
      </PageSection>
    );
  }

  const totalComponents = componentStatuses.length;
  const componentsWithViolations = componentStatuses.filter((c) => c.violationCount > 0).length;

  return (
    <>
      <PageSection variant={PageSectionVariants.light}>
        <TextContent>
          <Title headingLevel="h2" size="xl">
            Summary
          </Title>
          {totalComponents > 0 ? (
            <Text component="p" className="pf-v5-u-mt-sm">
              {componentsWithViolations} of {totalComponents} components have policy violations
            </Text>
          ) : (
            <Text component="p" className="pf-v5-u-mt-sm">
              Policy results are listed below without per-component rollup.
            </Text>
          )}
        </TextContent>
        <Flex
          className="pf-v5-u-mt-md"
          justifyContent={{ default: 'justifyContentSpaceBetween' }}
          alignItems={{ default: 'alignItemsFlexStart' }}
          flexWrap={{ default: 'wrap' }}
          spaceItems={{ default: 'spaceItemsMd' }}
        >
          {totalComponents > 0 ? (
            <FlexItem>
              <LabelGroup aria-label="Component policy status">
                {componentStatuses.map((c) => (
                  <Label
                    key={c.componentName}
                    color={componentLabelColor(c.status)}
                    icon={<ComponentStatusIcon status={c.status} />}
                  >
                    {c.componentName}
                  </Label>
                ))}
              </LabelGroup>
            </FlexItem>
          ) : (
            <FlexItem />
          )}
          <FlexItem>
            <AggregateCounts
              totalViolations={totalViolations}
              totalWarnings={totalWarnings}
              totalSuccesses={totalSuccesses}
            />
          </FlexItem>
        </Flex>
      </PageSection>
      <PageSection isFilled>
        <Title headingLevel="h2" size="lg" className="pf-v5-u-mb-md">
          Results
        </Title>
        <PolicyConformaTable results={allResults} />
      </PageSection>
    </>
  );
};

const PolicyPage: React.FC = () => (
  <IfFeature flag="conforma-policy">
    <PageLayout
      title={
        <Title headingLevel="h1" size="2xl">
          Policy Status Overview <FeatureFlagIndicator flags={['conforma-policy']} fullLabel />
        </Title>
      }
      description="Conforma policy evaluation status for your workspace."
    >
      <PolicyPageInner />
    </PageLayout>
  </IfFeature>
);

export default PolicyPage;
