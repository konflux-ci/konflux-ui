import * as React from 'react';
import { Content, Grid, GridItem } from '@patternfly/react-core';
import type { MintMakerScheduleEntry } from '~/hooks/useMintMakerSchedule';
import { Timestamp } from '~/shared';

type MintMakerScheduleExpandedContentProps = {
  entry: MintMakerScheduleEntry;
};

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

const getRelativeRunDate = (timestamp: string) => {
  const runDate = new Date(timestamp);
  if (Number.isNaN(runDate.getTime())) {
    return '-';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const runDay = new Date(runDate.getFullYear(), runDate.getMonth(), runDate.getDate());
  const daysFromToday = Math.round((runDay.getTime() - today.getTime()) / MILLISECONDS_PER_DAY);

  if (daysFromToday === 0) {
    return 'Today';
  }
  if (daysFromToday === 1) {
    return 'Tomorrow';
  }
  if (daysFromToday > 1) {
    return `In ${daysFromToday} days`;
  }
  return 'Earlier';
};

export const MintMakerScheduleExpandedContent = ({
  entry,
}: MintMakerScheduleExpandedContentProps) => {
  const futureRuns = entry.scheduledRuns.slice(1);

  return (
    <div
      className="mintmaker-schedule-expanded-content"
      data-test="mintmaker-schedule-expanded-content"
    >
      <Content component="h3">Future runs</Content>
      {futureRuns.length > 0 ? (
        <Grid hasGutter data-test="mintmaker-schedule-future-runs">
          {futureRuns.map((timestamp) => (
            <React.Fragment key={timestamp}>
              <GridItem span={12} md={6} data-test="mintmaker-schedule-future-run">
                <Timestamp timestamp={timestamp} simple />
              </GridItem>
              <GridItem span={12} md={6} data-test="mintmaker-schedule-future-run-relative">
                {getRelativeRunDate(timestamp)}
              </GridItem>
            </React.Fragment>
          ))}
        </Grid>
      ) : (
        <Content component="p">No future runs scheduled.</Content>
      )}
    </div>
  );
};
