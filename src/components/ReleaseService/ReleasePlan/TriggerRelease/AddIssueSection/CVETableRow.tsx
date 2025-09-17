import React from 'react';
import { Td, Tr } from '@patternfly/react-table';
import { FieldArrayRenderProps } from 'formik';
import ActionMenu from '../../../../../shared/components/action-menu/ActionMenu';
import { cveTableColumnClass } from './header';
import { CVEObject } from './types';

type Props = {
  arrayHelper: FieldArrayRenderProps;
  cve: CVEObject;
  index: number;
};

const CVETableRow: React.FC<Props> = ({ arrayHelper, cve, index }) => {
  return (
    <Tr key={cve.key}>
      <Td className={cveTableColumnClass.issueKey} data-test="issue-key">
        {cve.key ?? '-'}
      </Td>

      <>
        <Td className={cveTableColumnClass.component}>
          {cve.component ? (
            <span key={cve.component} className="pf-v5-u-mr-sm">
              {cve.component}
            </span>
          ) : (
            '-'
          )}
        </Td>
        <Td className={cveTableColumnClass.packages}>
          {cve.packages && cve.packages.length > 0 ? cve.packages.join(', ') : '-'}
        </Td>
      </>

      <Td className={cveTableColumnClass.kebab}>
        <ActionMenu
          actions={[
            {
              cta: () => arrayHelper.remove(index),
              id: 'delete-bug',
              label: 'Delete CVE',
            },
          ]}
        />
      </Td>
    </Tr>
  );
};

export default CVETableRow;
