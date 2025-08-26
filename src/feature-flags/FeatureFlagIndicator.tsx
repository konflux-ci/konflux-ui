import * as React from 'react';
import {
  Button,
  Label,
  Popover,
  Text,
  TextVariants,
  Flex,
  FlexItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { FlaskIcon } from '@patternfly/react-icons/dist/esm/icons/flask-icon';
import { FLAGS, FLAGS_STATUS, type FlagKey } from './flags';

type FeatureFlagIndicatorProps = {
  flags: FlagKey[];
  fullLabel?: boolean;
  'data-test'?: string;
};

const warningColor = 'var(--pf-v5-global--warning-color--100)';

export const FeatureFlagIndicator: React.FC<FeatureFlagIndicatorProps> = ({
  flags,
  fullLabel = false,
  'data-test': dataTest,
}) => {
  const metas = flags.map((f) => FLAGS[f]).filter(Boolean);
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
        <Text component={TextVariants.h6}>Experimental feature</Text>
      </FlexItem>
    </Flex>
  );

  const body = (
    <List isPlain>
      {metas.map((m) => (
        <ListItem key={m.key}>
          <Text component={TextVariants.small}>{m.description}</Text>
        </ListItem>
      ))}
    </List>
  );

  const trigger = fullLabel ? (
    <Label
      icon={<FlaskIcon style={{ color: warningColor }} />}
      color={labelColor}
      data-test={dataTest ?? `ff-indicator-${flags.join('-')}`}
    >
      {statusText}
    </Label>
  ) : (
    <Button
      isInline
      variant="plain"
      aria-label="Feature flag information"
      data-test={dataTest ?? `ff-indicator-${flags.join('-')}`}
    >
      <FlaskIcon style={{ color: warningColor }} />
    </Button>
  );

  return (
    <Popover position="right" headerContent={header} bodyContent={body}>
      {trigger}
    </Popover>
  );
};
