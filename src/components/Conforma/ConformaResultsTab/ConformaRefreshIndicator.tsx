import * as React from 'react';
import { Button, ButtonVariant, Flex, FlexItem, Label, Spinner, Text } from '@patternfly/react-core';
import { SyncIcon } from '@patternfly/react-icons/dist/esm/icons/sync-icon';
import { fromNow } from '~/shared/components/timestamp/datetime';
import type { ConformaRefreshState } from '~/types/conforma';

const RELATIVE_TIME_INTERVAL_MS = 30_000;

const useRelativeTime = (epochMs: number): string => {
  const [, setTick] = React.useState(0);

  React.useEffect(() => {
    if (!epochMs) return;
    const id = setInterval(() => setTick((n) => n + 1), RELATIVE_TIME_INTERVAL_MS);
    return () => clearInterval(id);
  }, [epochMs]);

  if (!epochMs) return '';
  return fromNow(new Date(epochMs));
};

type ConformaRefreshIndicatorProps = {
  refresh: ConformaRefreshState;
};

export const ConformaRefreshIndicator: React.FC<ConformaRefreshIndicatorProps> = React.memo(
  ({ refresh }) => {
    const relativeTime = useRelativeTime(refresh.lastFetchedAt);

    return (
      <Flex
        alignItems={{ default: 'alignItemsCenter' }}
        spaceItems={{ default: 'spaceItemsSm' }}
        className="conforma-results-toolbar__refresh"
      >
        {refresh.hasLiveUpdatesPaused && (
          <FlexItem>
            <Label color="orange" data-test="conforma-live-updates-paused">
              Live updates paused
            </Label>
          </FlexItem>
        )}
        {relativeTime && (
          <FlexItem>
            <Text
              component="small"
              className="conforma-results-toolbar__last-checked"
              data-test="conforma-last-checked"
            >
              Last checked: {relativeTime}
            </Text>
          </FlexItem>
        )}
        {refresh.isRefreshing && (
          <FlexItem>
            <Spinner size="sm" aria-label="Refreshing Conforma results" />
          </FlexItem>
        )}
        <FlexItem>
          <Button
            variant={ButtonVariant.link}
            onClick={refresh.onRefresh}
            isDisabled={refresh.isRefreshing}
            aria-label="Refresh Conforma results"
            data-test="conforma-refresh-button"
            className={
              refresh.hasLiveUpdatesPaused
                ? 'conforma-results-toolbar__refresh-button--highlighted'
                : undefined
            }
            icon={<SyncIcon />}
          >
            Refresh
          </Button>
        </FlexItem>
      </Flex>
    );
  },
);
