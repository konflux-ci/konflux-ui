import React from 'react';
import { Modal, Button, TextContent, Text } from '@patternfly/react-core';

interface ErrorModalProps {
  title: string;
  errorMessage: string;
  isOpen: boolean;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ title, errorMessage, isOpen, onClose }) => {
  return (
    <Modal
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      aria-label="Error details modal"
      className="pf-m-sm"
      actions={[
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>,
      ]}
    >
      <TextContent>
        <Text component="pre" style={{ whiteSpace: 'pre-wrap' }}>
          {errorMessage}
        </Text>
      </TextContent>
    </Modal>
  );
};

export default ErrorModal;
