import * as React from 'react';
import { Button, ButtonVariant, Content, Flex, FlexItem, Tooltip } from '@patternfly/react-core';
import { SyncIcon } from '@patternfly/react-icons/dist/esm/icons/sync-icon';
import * as dateTime from '~/shared/components/timestamp/datetime';
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
  return dateTime.fromNow(new Date(epochMs));
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
        {relativeTime && (
          <FlexItem aria-live="polite">
            <Tooltip
              content={[
                <span className="nowrap" key={refresh.lastFetchedAt}>
                  {dateTime.utcDateTimeFormatter.format(new Date(refresh.lastFetchedAt))}
                </span>,
              ]}
            >
              <Content
                component="small"
                className="conforma-results-toolbar__last-checked"
                data-test="conforma-last-checked"
              >
                Last checked: {relativeTime}
              </Content>
            </Tooltip>
          </FlexItem>
        )}
        <FlexItem>
          <Button
            variant={ButtonVariant.plain}
            onClick={refresh.onRefresh}
            isDisabled={refresh.isRefreshing}
            isLoading={refresh.isRefreshing}
            spinnerAriaLabel="Refreshing Conforma results"
            aria-label="Refresh Conforma results"
            data-test="conforma-refresh-button"
            icon={<SyncIcon />}
          >
            Refresh
          </Button>
        </FlexItem>
      </Flex>
    );
  },
);
