import React from 'react';
import { Button, Popover, Stack, StackItem } from '@patternfly/react-core';
import './TruncatedLinkListWithPopover.scss';

type Props<T> = {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  getKey?: (item: T) => React.Key;
  maxVisible?: number;
  popover: {
    header: string;
    ariaLabel: string;
    moreText: (count: number) => string;
    dataTestPrefix: string;
  };
};

const TruncatedLinkListWithPopover = <T,>({
  items,
  popover,
  renderItem,
  maxVisible = 3,
  getKey = String,
}: Props<T>) => {
  const itemsCount = items.length;
  const visibleItems = React.useMemo(() => items.slice(0, maxVisible), [items, maxVisible]);
  const hiddenItems = React.useMemo(() => items.slice(maxVisible), [items, maxVisible]);

  const popoverBodyContent = React.useMemo(
    () => hiddenItems.map((item) => <StackItem key={getKey(item)}>{renderItem(item)}</StackItem>),
    [hiddenItems, renderItem, getKey],
  );
  return (
    <div className="truncated-link-list">
      {itemsCount > 0 ? (
        <>
          {visibleItems.map((item) => (
            <React.Fragment key={getKey(item)}>{renderItem(item)}</React.Fragment>
          ))}
          {hiddenItems.length > 0 && (
            <Popover
              data-test={popover.dataTestPrefix}
              aria-label={popover.ariaLabel}
              headerContent={popover.header}
              enableFlip
              bodyContent={
                <Stack
                  className="truncated-link-list-popover-stack"
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {popoverBodyContent}
                </Stack>
              }
            >
              <Button variant="link" isInline>
                {popover.moreText(hiddenItems.length)}
              </Button>
            </Popover>
          )}
        </>
      ) : (
        '-'
      )}
    </div>
  );
};

export default TruncatedLinkListWithPopover;
