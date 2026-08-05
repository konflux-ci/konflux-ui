import * as React from 'react';
import { Content, ContentVariants, Divider, Flex, FlexItem, Tooltip } from '@patternfly/react-core';

type SummaryItemDef = {
  icon: React.ReactNode;
  count: number;
  rawCount?: number;
  label: string;
  tooltip: string;
};

const SummaryItem: React.FC<SummaryItemDef> = ({ icon, count, rawCount, label, tooltip }) => (
  <Tooltip content={tooltip}>
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>{icon}</FlexItem>
      <FlexItem>
        {count} {label}
        {rawCount !== undefined && rawCount !== count && (
          <Content component={ContentVariants.small} className="pf-v6-u-ml-s pf-v6-u-color-400">
            ({rawCount} incl. multi-arch)
          </Content>
        )}
      </FlexItem>
    </Flex>
  </Tooltip>
);

export type ConformaSummaryBarSectionProps = {
  title: string;
  'data-test': string;
  items: SummaryItemDef[];
};

export const ConformaSummaryBarSection: React.FC<ConformaSummaryBarSectionProps> = ({
  title,
  'data-test': dataTest,
  items,
}) => (
  <FlexItem className="conforma-summary-bar__section" data-test={dataTest}>
    <Content component={ContentVariants.h4} className="pf-v6-u-mb-sm">
      {title}
    </Content>
    <Flex spaceItems={{ default: 'spaceItemsLg' }} alignItems={{ default: 'alignItemsCenter' }}>
      {items.map((item, i) => (
        <React.Fragment key={item.label}>
          {i > 0 && <Divider orientation={{ default: 'vertical' }} />}
          <FlexItem>
            <SummaryItem {...item} />
          </FlexItem>
        </React.Fragment>
      ))}
    </Flex>
  </FlexItem>
);
