import React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';

export interface TextColumnFieldFooter {
  addLabel?: string;
  onAdd: () => void;
  disableAddRow?: boolean;
}

const TextColumnFieldFooter: React.FC<React.PropsWithChildren<TextColumnFieldFooter>> = ({
  addLabel,
  onAdd,
  disableAddRow = false,
}) => {
  return (
    <Button
      data-test={'add-action'}
      variant="link"
      isDisabled={disableAddRow}
      onClick={onAdd}
      icon={<PlusCircleIcon />}
      isInline
    >
      {addLabel || 'Add values'}
    </Button>
  );
};

export default TextColumnFieldFooter;
