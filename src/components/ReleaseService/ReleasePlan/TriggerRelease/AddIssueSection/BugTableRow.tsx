import React from 'react';
import { Truncate } from '@patternfly/react-core';
import { Td, Tr } from '@patternfly/react-table';
import { FieldArrayRenderProps } from 'formik';
import ActionMenu from '../../../../../shared/components/action-menu/ActionMenu';
import { issueTableColumnClass } from './header';
import { BugObject } from './types';

type Props = {
  arrayHelper: FieldArrayRenderProps;
  bug: BugObject;
  index: number;
};

const BugTableRow: React.FC<Props> = ({ arrayHelper, bug, index }) => {
  return (
    <Tr key={bug.id}>
      <Td className={issueTableColumnClass.issueKey} data-test="issue-key">
        {bug.id ?? '-'}
      </Td>
      <Td className={issueTableColumnClass.bugUrl} data-test="issue-url">
        <Truncate content={bug.source} />
      </Td>
      <Td className={issueTableColumnClass.summary} data-test="issue-summary">
        {bug.summary ? <Truncate content={bug.summary} /> : '-'}
      </Td>
      <Td className={issueTableColumnClass.uploadDate} data-test="issue-uploadDate">
        {bug.uploadDate ?? '-'}
      </Td>
      <Td className={issueTableColumnClass.status} data-test="issue-status">
        {bug.status ?? '-'}
      </Td>
      <Td className={issueTableColumnClass.kebab}>
        <ActionMenu
          actions={[
            {
              cta: () => arrayHelper.remove(index),
              id: 'delete-bug',
              label: 'Delete bug',
            },
          ]}
        />
      </Td>
    </Tr>
  );
};

export default BugTableRow;
