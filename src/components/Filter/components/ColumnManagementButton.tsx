import React from 'react';
import { Button } from '@patternfly/react-core';
//eslint-disable-next-line @typescript-eslint/no-unused-vars
import ColumnManagement from '~/components/ColumnManagement/ColumnManagement';

interface ColumnManagementButtonProps {
  onClick: () => void;
  totalColumns?: number;
}
/**
 * @deprecated This component is deprecated and will be removed in the future. Use {@link ColumnManagement}
 */
const ColumnManagementButton: React.FC<ColumnManagementButtonProps> = ({
  onClick,
  totalColumns = 0,
}) => {
  if (totalColumns <= 6) {
    return null;
  }

  return (
    <Button variant="secondary" aria-label="Manage columns" onClick={onClick}>
      Manage columns
    </Button>
  );
};

export default ColumnManagementButton;
