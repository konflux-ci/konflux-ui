import * as React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Label,
} from '@patternfly/react-core';
import { capitalize } from 'lodash-es';
import { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { Countdown, Timestamp } from '~/shared';

type MintMakerScheduleManagerCardProps = {
  entry: MintMakerScheduleEntry;
};

export const MintMakerScheduleManagerCard = ({ entry }: MintMakerScheduleManagerCardProps) => {
  const { manager, scheduledRuns } = entry;
  const nextRun = scheduledRuns[0];
  const laterRuns = scheduledRuns.slice(1);

  return (
    <Card data-test="mintmaker-schedule-manager-card" data-manager={manager} isCompact>
      <CardHeader>
        <CardTitle component="h3" data-test="mintmaker-schedule-manager">
          {capitalize(manager)}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
          {nextRun && (
            <FlexItem>
              <Card isCompact data-test="mintmaker-schedule-next-run">
                <CardBody>
                  <Flex
                    alignItems={{ default: 'alignItemsCenter' }}
                    gap={{ default: 'gapMd' }}
                    flexWrap={{ default: 'wrap' }}
                  >
                    <Label color="blue" isCompact data-test="mintmaker-next-label">
                      Next run
                    </Label>
                    <span data-test="mintmaker-schedule-next-timestamp">
                      <Timestamp timestamp={nextRun} simple />
                    </span>
                    <span data-test="mintmaker-schedule-next-countdown">
                      in <Countdown timestamp={nextRun} simple />
                    </span>
                  </Flex>
                </CardBody>
              </Card>
            </FlexItem>
          )}

          {laterRuns.length > 0 && (
            <FlexItem>
              <Content component={ContentVariants.small} className="pf-v6-u-mb-sm">
                Later runs
              </Content>
              <Grid hasGutter data-test="mintmaker-schedule-later-runs">
                {laterRuns.map((timestamp) => (
                  <React.Fragment key={timestamp}>
                    <GridItem span={12} md={6} data-test="mintmaker-schedule-later-run">
                      <Timestamp timestamp={timestamp} />
                    </GridItem>
                    <GridItem span={12} md={6}>
                      <Countdown timestamp={timestamp} />
                    </GridItem>
                  </React.Fragment>
                ))}
              </Grid>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
