import { Th, Thead, Tr } from '@patternfly/react-table';
import { issueTableColumnClass } from './header';

const BugTableHead: React.FC = () => {
  return (
    <Thead>
      <Tr>
        <Th className={issueTableColumnClass.issueKey}>Bug issue key</Th>
        <Th className={issueTableColumnClass.bugUrl}>URL</Th>
        <Th className={issueTableColumnClass.summary}>Summary</Th>
        <Th className={issueTableColumnClass.uploadDate}>Last updated</Th>
        <Th className={issueTableColumnClass.status}>Status</Th>
      </Tr>
    </Thead>
  );
};

export default BugTableHead;
