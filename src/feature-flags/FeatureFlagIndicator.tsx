import * as React from 'react';
import {
  Button,
  Label,
  Popover,
  Content,
  ContentVariants,
  Flex,
  FlexItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { FLAGS, FLAGS_STATUS, type FlagKey } from './flags';
import { useFeatureFlags } from './hooks';

type FeatureFlagIndicatorProps = {
  flags: FlagKey[];
  fullLabel?: boolean;
  'data-test'?: string;
};

const warningColor = 'var(--pf-t--global--color--status--warning--default)';

export const FeatureFlagIndicator: React.FC<FeatureFlagIndicatorProps> = ({
  flags,
  fullLabel = false,
  'data-test': dataTest,
}) => {
  const [allFlags] = useFeatureFlags();
  const activeFlags = flags.filter((f) => allFlags[f]);
  const metas = activeFlags.map((f) => FLAGS[f]).filter(Boolean);
  if (metas.length === 0) return null;

  const anyWip = metas.some((m) => m.status === 'wip');
  const statusText = anyWip ? FLAGS_STATUS.wip : FLAGS_STATUS.ready;
  const labelColor = anyWip ? 'orange' : 'green';

  const header = (
    <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <FlaskIcon style={{ color: warningColor }} />
      </FlexItem>
      <FlexItem>
        <Content component={ContentVariants.h6}>Experimental feature</Content>
      </FlexItem>
    </Flex>
  );

  const body = (
    <List isPlain>
      {metas.map((m) => (
        <ListItem key={m.key}>
          <Content component={ContentVariants.small}>{m.description}</Content>
        </ListItem>
      ))}
    </List>
  );

  const trigger = fullLabel ? (
    <Button
      icon={
        <Label icon={<FlaskIcon style={{ color: warningColor }} />} color={labelColor}>
          {statusText}
        </Label>
      }
      isInline
      variant="plain"
      aria-label="Feature flag information"
      data-test={dataTest ?? `ff-indicator-${flags.join('-')}`}
    />
  ) : (
    <Button
      icon={<FlaskIcon style={{ color: warningColor }} />}
      isInline
      variant="plain"
      aria-label="Feature flag information"
      data-test={dataTest ?? `ff-indicator-${flags.join('-')}`}
    />
  );

  return (
    <Popover position="right" headerContent={header} bodyContent={body}>
      {trigger}
    </Popover>
  );
};
