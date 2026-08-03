import React from 'react';
import { Button, Content } from '@patternfly/react-core';
import { ComponentProps } from './createModalLauncher';

type ErrorModalProps = ComponentProps & {
  errorMessage: string;
};

const ErrorModal: React.FC<ErrorModalProps> = ({ errorMessage, onClose }) => {
  return (
    <>
      <Content>
        <Content component="pre" style={{ whiteSpace: 'pre-wrap' }}>
          {errorMessage}
        </Content>
      </Content>

      <Button key="close" variant="primary" onClick={onClose} className="pf-v6-u-mt-md">
        Close
      </Button>
    </>
  );
};

export default ErrorModal;
