import React from 'react';
import { Button, Popover, Stack, StackItem } from '@patternfly/react-core';
import './TruncatedLinkListWithPopover.scss';

type Props = {
  items: string[];
  renderItem: (item: string) => React.ReactNode;
  maxVisible?: number;
  popover: {
    header: string;
    ariaLabel: string;
    moreText: (count: number) => string;
    dataTestIdPrefix: string;
  };
};

const TruncatedLinkListWithPopover: React.FC<Props> = ({
  items,
  popover,
  renderItem,
  maxVisible = 3,
}) => {
  const itemsCount = items.length;
  const visibleItems = React.useMemo(() => items.slice(0, maxVisible), [items, maxVisible]);
  const hiddenItems = React.useMemo(() => items.slice(maxVisible), [items, maxVisible]);

  const popoverBodyContent = React.useMemo(
    () => hiddenItems.map((item) => <StackItem key={item}>{renderItem(item)}</StackItem>),
    [hiddenItems, renderItem],
  );
  return (
    <div className="truncated-link-list">
      {itemsCount > 0 ? (
        <>
          {visibleItems.map((appName) => renderItem(appName))}
          {hiddenItems.length > 0 && (
            <Popover
              data-testid={popover.dataTestIdPrefix}
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
