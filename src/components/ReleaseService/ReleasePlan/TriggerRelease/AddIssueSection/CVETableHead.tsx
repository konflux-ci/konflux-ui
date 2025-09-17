import { Th, Thead, Tr } from '@patternfly/react-table';
import { cveTableColumnClass } from './header';

const CVETableHead: React.FC = () => {
  return (
    <Thead>
      <Tr>
        <Th className={cveTableColumnClass.issueKey}>CVE key</Th>
        <Th className={cveTableColumnClass.component}>Component</Th>
        <Th className={cveTableColumnClass.packages}>Packages</Th>
      </Tr>
    </Thead>
  );
};

export default CVETableHead;
