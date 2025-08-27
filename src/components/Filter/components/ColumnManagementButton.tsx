import React from 'react';
import { Button } from '@patternfly/react-core';

interface ColumnManagementButtonProps {
  onClick: () => void;
  totalColumns?: number;
}

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
