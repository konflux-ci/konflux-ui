import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { LockIcon, LockOpenIcon } from '@patternfly/react-icons/dist/esm/icons';
import { t_global_icon_color_status_danger_default as redColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_danger_default';
import { t_global_icon_color_status_success_default as greenColor } from '@patternfly/react-tokens/dist/js/t_global_icon_color_status_success_default';

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
    <FlexItem style={{ marginRight: 'var(--pf-t--global--spacer--sm)' }}>
      {locked ? <LockedIcon /> : <UnlockedIcon />}
    </FlexItem>
    {!condensed ? <FlexItem>{locked ? 'Resolved' : 'Active'}</FlexItem> : null}
  </Flex>
);
