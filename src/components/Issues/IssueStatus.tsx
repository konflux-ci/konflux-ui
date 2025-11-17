import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { LockIcon, LockOpenIcon } from '@patternfly/react-icons/dist/esm/icons';
import { global_palette_green_400 as greenColor } from '@patternfly/react-tokens/dist/js/global_palette_green_400';
import { global_palette_red_200 as redColor } from '@patternfly/react-tokens/dist/js/global_palette_red_200';

export const LockedIcon: React.FC = () => <LockIcon title="Resolved" color={redColor.value} />;

export const UnlockedIcon: React.FC = () => (
  <LockOpenIcon title="Active" color={greenColor.value} />
);

type IssueStatusProps = {
  locked: boolean;
  condensed?: boolean;
};

export const IssueStatus: React.FC<IssueStatusProps> = ({ locked, condensed }) => (
  <Flex direction={{ default: 'row' }}>
    <FlexItem style={{ marginRight: 'var(--pf-v5-global--spacer--sm)' }}>
      {locked ? <LockedIcon /> : <UnlockedIcon />}
    </FlexItem>
    {!condensed ? <FlexItem>{locked ? 'Resolved' : 'Active'}</FlexItem> : null}
  </Flex>
);
