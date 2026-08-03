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
  Skeleton,
  Content,
  Title,
} from '@patternfly/react-core';
import { chart_color_orange_100 as chartOrange100 } from '@patternfly/react-tokens/dist/js/chart_color_orange_100';
import { chart_color_yellow_100 as chartYellow100 } from '@patternfly/react-tokens/dist/js/chart_color_yellow_100';
import { chart_color_yellow_200 as chartYellow200 } from '@patternfly/react-tokens/dist/js/chart_color_yellow_200';
import { chart_color_yellow_300 as chartYellow300 } from '@patternfly/react-tokens/dist/js/chart_color_yellow_300';
import { chart_color_yellow_400 as chartYellow400 } from '@patternfly/react-tokens/dist/js/chart_color_yellow_400';
import { chart_color_yellow_500 as chartYellow500 } from '@patternfly/react-tokens/dist/js/chart_color_yellow_500';
import { capitalize } from 'lodash-es';
import { IssueSeverity } from '~/kite/issue-type';
import { useIssueCountsBySeverity, useIssueCountsByType } from '~/kite/kite-hooks';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import './IssueDistributionCard.scss';

const convertToPieChartData = (data: Record<string, number>) => {
  return Object.entries(data).map(([key, value]) => ({ x: key, y: value }));
};

const CHART_DIMENSIONS = {
  width: 300,
  height: 300,
} as const;

const LEGEND_COLORS = [
  chartYellow300.value,
  chartYellow100.value,
  chartYellow200.value,
  chartYellow400.value,
  chartYellow500.value,
  chartOrange100.value,
];

const SEVERITY_ORDER = [
  IssueSeverity.CRITICAL,
  IssueSeverity.MAJOR,
  IssueSeverity.MINOR,
  IssueSeverity.INFO,
];

const SeverityDistributionSection: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { counts, isLoaded, error } = useIssueCountsBySeverity(namespace);

  return (
    <>
      <FlexItem>
        <Title headingLevel="h3" size="lg">
          Issues by severity
        </Title>
      </FlexItem>

      {error ? (
        getErrorState(error, isLoaded, 'issue severity data', true)
      ) : (
        <FlexItem>
          <Flex
            direction={{ default: 'row' }}
            justifyContent={{ default: 'justifyContentSpaceAround' }}
          >
            {SEVERITY_ORDER.map((severity) => (
              <FlexItem key={severity} style={{ textAlign: 'center' }}>
                <Flex
                  direction={{ default: 'column' }}
                  alignItems={{ default: 'alignItemsCenter' }}
                >
                  {isLoaded ? (
                    <Title
                      headingLevel="h4"
                      size="3xl"
                      className="issue-distribution-card__severity-count"
                    >
                      {counts?.[severity] ?? '-'}
                    </Title>
                  ) : (
                    <Skeleton
                      shape="square"
                      width="45%"
                      className="issue-distribution-card__severity-count"
                    />
                  )}
                  <Content component="p" className="issue-distribution-card__severity-label">
                    {capitalize(severity)}
                  </Content>
                </Flex>
              </FlexItem>
            ))}
          </Flex>
        </FlexItem>
      )}
    </>
  );
};

const TypeDistributionSection: React.FC<{ namespace: string }> = ({ namespace }) => {
  const { counts, isLoaded, error } = useIssueCountsByType(namespace);

  const [resourceData, hasIssues] = useMemo(() => {
    const data = convertToPieChartData(counts || {});
    const hasData = data.some((elem) => elem.y !== 0);
    return [data, hasData];
  }, [counts]);

  return (
    <>
      <FlexItem>
        <Title headingLevel="h3" size="lg">
          Issues by type
        </Title>
      </FlexItem>
      {error ? (
        getErrorState(error, isLoaded, 'issue type data', true)
      ) : (
        <FlexItem>
          <Flex
            direction={{ default: 'row' }}
            alignItems={{ default: 'alignItemsCenter' }}
            gap={{ default: 'gapNone' }}
          >
            <FlexItem>
              <Bullseye className="issue-distribution-card__chart-wrapper">
                {isLoaded ? (
                  hasIssues ? (
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
                    <Flex
                      className="issue-distribution-card__chart-empty-state"
                      justifyContent={{ default: 'justifyContentCenter' }}
                      alignItems={{ default: 'alignItemsCenter' }}
                    >
                      <Content component="p">No issues found</Content>
                    </Flex>
                  )
                ) : (
                  <Skeleton
                    shape="circle"
                    className="issue-distribution-card__chart-loading-state"
                  />
                )}
              </Bullseye>
            </FlexItem>
            <FlexItem>
              <Flex
                className="issue-distribution-card__legend"
                direction={{ default: 'column' }}
                gap={{ default: 'gapSm' }}
                aria-label="Chart legend"
              >
                {isLoaded ? (
                  hasIssues ? (
                    resourceData.map((item, index) => (
                      <Flex
                        gap={{ default: 'gapSm' }}
                        alignItems={{ default: 'alignItemsCenter' }}
                        key={item.x}
                      >
                        <div
                          className="issue-distribution-card__legend-color"
                          style={{ backgroundColor: LEGEND_COLORS[index] }}
                          aria-hidden="true"
                        />
                        <Content component="p">
                          {capitalize(item.x)}: {item.y}
                        </Content>
                      </Flex>
                    ))
                  ) : (
                    <Content component="p">No data to display</Content>
                  )
                ) : (
                  Array.from({ length: 5 }).map((_, index) => (
                    <Flex gap={{ default: 'gapSm' }} key={`skeleton-${index}`}>
                      <Skeleton shape="square" width="16px" height="16px" />
                      <Skeleton width="120px" height="16px" />
                    </Flex>
                  ))
                )}
              </Flex>
            </FlexItem>
          </Flex>
        </FlexItem>
      )}
    </>
  );
};

export const IssueDistributionCard = () => {
  const navigate = useNavigate();
  const namespace = useNamespace();

  return (
    <Card>
      <CardBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapXl' }}>
          <SeverityDistributionSection namespace={namespace} />
          <TypeDistributionSection namespace={namespace} />
          <FlexItem>
            <Button variant="link" isInline onClick={() => navigate(`list`)}>
              View more
            </Button>
          </FlexItem>
        </Flex>
      </CardBody>
    </Card>
  );
};
