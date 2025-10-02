import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartPie } from '@patternfly/react-charts';
import {
  Bullseye,
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Spinner,
  Text,
  Title,
} from '@patternfly/react-core';
import './IssueDistributionCard.scss';
import { capitalize } from 'lodash-es';
import { useIssueCounts } from '~/hooks/useIssues';
import { getErrorState } from '~/shared/utils/error-utils';

const convertToPieChartData = (data: Record<string, number>) => {
  return Object.entries(data).map(([key, value]) => ({ x: key, y: value }));
};

const CHART_DIMENSIONS = {
  width: 300,
  height: 300,
} as const;

const LEGEND_COLORS = ['#DCA614', '#FFF4CC', '#FFCC17', '#96640F', '#B98412', '#FFE072', '#73480B'];

const SEVERITY_CONFIG = [
  { key: 'critical' as const, label: 'Critical' },
  { key: 'major' as const, label: 'Important' },
  { key: 'minor' as const, label: 'Moderate' },
  { key: 'info' as const, label: 'Minor' },
  { key: 'undefined' as const, label: 'Undefined' },
] as const;

const SeverityDistributionSection: React.FC<{ severityData: Record<string, number> }> = ({
  severityData,
}) => (
  <>
    <FlexItem>
      <Title headingLevel="h3" size="lg" className="issue-distribution-card__section-title">
        Issues by severity
      </Title>
    </FlexItem>
    <FlexItem>
      <Flex
        direction={{ default: 'row' }}
        justifyContent={{ default: 'justifyContentSpaceAround' }}
      >
        {SEVERITY_CONFIG.map(({ key, label }) => (
          <FlexItem key={key} className="issue-distribution-card__severity-item">
            <Title headingLevel="h4" size="3xl" className="issue-distribution-card__severity-count">
              {severityData[key] || 0}
            </Title>
            <Text className="issue-distribution-card__severity-label">{label}</Text>
          </FlexItem>
        ))}
      </Flex>
    </FlexItem>
  </>
);

const TypeDistributionSection: React.FC<{ resourceData: Array<{ x: string; y: number }> }> = ({
  resourceData,
}) => (
  <>
    <FlexItem>
      <Title headingLevel="h3" size="lg" className="issue-distribution-card__section-title">
        Issues by type
      </Title>
    </FlexItem>
    <FlexItem>
      <Flex
        direction={{ default: 'row' }}
        alignItems={{ default: 'alignItemsCenter' }}
        gap={{ default: 'gapNone' }}
      >
        <FlexItem>
          <div className="issue-distribution-card__chart-wrapper">
            {resourceData.length > 0 ? (
              <ChartPie
                ariaDesc="Distribution of issues by type showing breakdown across different categories"
                ariaTitle="Issues by type"
                data={resourceData}
                width={CHART_DIMENSIONS.width}
                height={CHART_DIMENSIONS.height}
                innerRadius={0}
                colorScale={LEGEND_COLORS}
              />
            ) : (
              <div className="issue-distribution-card__chart-empty-state">
                <Text>No issues found</Text>
              </div>
            )}
          </div>
        </FlexItem>
        <FlexItem>
          <div className="issue-distribution-card__legend" role="img" aria-label="Chart legend">
            {resourceData.length > 0 ? (
              resourceData.map((item, index) => (
                <div className="issue-distribution-card__legend-item" key={item.x}>
                  <div
                    className="issue-distribution-card__legend-color"
                    style={{ backgroundColor: LEGEND_COLORS[index] }}
                    aria-hidden="true"
                  />
                  <Text className="issue-distribution-card__legend-text">
                    {capitalize(item.x)}: {item.y}
                  </Text>
                </div>
              ))
            ) : (
              <Text>No data to display</Text>
            )}
          </div>
        </FlexItem>
      </Flex>
    </FlexItem>
  </>
);

export const IssueDistributionCard = () => {
  const navigate = useNavigate();
  const { counts, isLoaded, error } = useIssueCounts();

  const resourceData = useMemo(() => {
    return convertToPieChartData(counts?.issueType || {});
  }, [counts?.issueType]);

  if (!isLoaded) {
    return (
      <Card>
        <CardBody>
          <Bullseye>
            <Spinner size="xl" />
          </Bullseye>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return getErrorState(error, isLoaded, 'issues', true);
  }

  return (
    <Card>
      <CardBody>
        <Flex direction={{ default: 'column' }} className="issue-distribution-card">
          <SeverityDistributionSection severityData={counts?.severity || {}} />
          <TypeDistributionSection resourceData={resourceData} />
          <FlexItem>
            <Button
              variant="link"
              className="issue-distribution-card__view-more-button"
              onClick={() => navigate('/issues')} // TODO: Replace with actual issues route
            >
              View more
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
