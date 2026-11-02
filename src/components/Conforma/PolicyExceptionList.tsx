import * as React from 'react';
import { Flex, FlexItem, Label } from '@patternfly/react-core';
import classNames from 'classnames';
import { WarningIcon } from '~/shared/components/status/icons';
import {
  formatDaysRemaining,
  PolicyExceptionKind,
  type PolicyException,
} from './policy-exception-utils';

import './PolicyExceptionList.scss';

const PolicyExceptionRow: React.FC<{ exception: PolicyException }> = ({ exception }) => (
  <Flex
    className="policy-exception-list__row"
    alignItems={{ default: 'alignItemsCenter' }}
    spaceItems={{ default: 'spaceItemsSm' }}
    flexWrap={{ default: 'nowrap' }}
    data-test={`policy-exception-row-${exception.code}`}
  >
    <FlexItem>
      <WarningIcon />
    </FlexItem>
    <FlexItem className="policy-exception-list__message">{exception.message}</FlexItem>
    <FlexItem className="policy-exception-list__code">{exception.code}</FlexItem>
    <FlexItem align={{ default: 'alignRight' }}>
      <Label
        isCompact
        variant="outline"
        color={exception.kind === PolicyExceptionKind.EXPIRING ? 'orange' : 'blue'}
        data-test={`policy-exception-timing-${exception.code}`}
      >
        {formatDaysRemaining(exception.daysRemaining)}
      </Label>
    </FlexItem>
  </Flex>
);

type PolicyExceptionListProps = {
  exceptions: PolicyException[];
  /** Rendered in place of the rows when there is nothing upcoming. */
  emptyMessage?: string;
  className?: string;
};

/**
 * Rows of upcoming policy changes: warning icon, message and rule code on the
 * left, with the time remaining as a right-aligned compact badge.
 */
export const PolicyExceptionList: React.FC<PolicyExceptionListProps> = ({
  exceptions,
  emptyMessage = 'No expiring exceptions or upcoming activations.',
  className,
}) => {
  const listClassName = classNames('policy-exception-list', className);

  if (exceptions.length === 0) {
    return (
      <div className={listClassName} data-test="policy-exception-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={listClassName} data-test="policy-exception-list">
      {exceptions.map((exception) => (
        <PolicyExceptionRow key={`${exception.kind}:${exception.code}`} exception={exception} />
      ))}
    </div>
  );
};
