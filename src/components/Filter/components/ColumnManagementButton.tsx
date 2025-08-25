import React from 'react';
import { Button } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons/dist/esm/icons/cog-icon';
import { IfFeature } from '~/feature-flags/hooks';

interface ColumnManagementButtonProps {
  onClick: () => void;
  totalColumns?: number;
}

const ColumnManagementButton: React.FC<ColumnManagementButtonProps> = ({
  onClick,
  totalColumns = 0,
}) => {
  if (!onClick || totalColumns <= 6) {
    return null;
  }

  return (
    <IfFeature flag="column-management">
      <Button variant="plain" aria-label="Manage columns" onClick={onClick} icon={<CogIcon />}>
        Manage columns
      </Button>
    </IfFeature>
  );
};

export default ColumnManagementButton;
