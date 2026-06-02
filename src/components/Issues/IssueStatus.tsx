import * as React from 'react';
import { Flex, FlexItem } from '@patternfly/react-core';
import { LockIcon, LockOpenIcon } from '@patternfly/react-icons/dist/esm/icons';
import {
  t_temp_dev_tbd as greenColor /* CODEMODS: you should update this color token, original v5 token was global_palette_green_400 */,
} from '@patternfly/react-tokens/dist/js/t_temp_dev_tbd';
import {
  t_temp_dev_tbd as redColor /* CODEMODS: you should update this color token, original v5 token was global_palette_red_200 */,
} from '@patternfly/react-tokens/dist/js/t_temp_dev_tbd';

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
