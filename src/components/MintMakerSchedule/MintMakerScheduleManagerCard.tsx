import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  Label,
} from '@patternfly/react-core';
import { capitalize } from 'lodash-es';
import { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { Countdown, Timestamp } from '~/shared';

import './MintMakerScheduleManagerCard.scss';

type MintMakerScheduleManagerCardProps = {
  entry: MintMakerScheduleEntry;
};

export const MintMakerScheduleManagerCard = ({ entry }: MintMakerScheduleManagerCardProps) => {
  const { manager, scheduledRuns } = entry;
  const nextRun = scheduledRuns[0];
  const laterRuns = scheduledRuns.slice(1);

  return (
    <Card
      className="mintmaker-schedule-manager-card"
      data-test="mintmaker-schedule-manager-card"
      data-manager={manager}
      isCompact
    >
      <CardHeader>
        <CardTitle component="h3" data-test="mintmaker-schedule-manager">
          {capitalize(manager)}
        </CardTitle>
      </CardHeader>
      <CardBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapLg' }}>
          {nextRun && (
            <FlexItem>
              <div
                className="mintmaker-schedule-manager-card__next-run"
                data-test="mintmaker-schedule-next-run"
              >
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
              </div>
            </FlexItem>
          )}

          {laterRuns.length > 0 && (
            <FlexItem>
              <Content component={ContentVariants.small} className="pf-v6-u-mb-sm">
                Later runs
              </Content>
              <div
                className="mintmaker-schedule-manager-card__later-runs"
                data-test="mintmaker-schedule-later-runs"
              >
                {laterRuns.map((timestamp) => (
                  <div
                    key={timestamp}
                    className="mintmaker-schedule-manager-card__later-run"
                    data-test="mintmaker-schedule-later-run"
                  >
                    <Timestamp timestamp={timestamp} />
                    <Countdown timestamp={timestamp} />
                  </div>
                ))}
              </div>
            </FlexItem>
          )}
        </Flex>
      </CardBody>
    </Card>
  );
};
