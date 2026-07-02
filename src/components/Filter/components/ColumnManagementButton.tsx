import React from 'react';
import { Button } from '@patternfly/react-core';

interface ColumnManagementButtonProps {
  onClick: () => void;
  totalColumns?: number;
}
/**
 * @deprecated This component is deprecated and will be removed in the future.
 * Use ColumnManagement from ~/components/ColumnManagement/ColumnManagement instead.
 */
const ColumnManagementButton: React.FC<ColumnManagementButtonProps> = ({
  onClick,
  totalColumns = 0,
}) => {
  if (totalColumns <= 6) {
    return null;
  }

  return (
    <Button variant="primary" aria-label="Manage columns" onClick={onClick}>
      Manage columns
    </Button>
  );
};

export default ColumnManagementButton;
