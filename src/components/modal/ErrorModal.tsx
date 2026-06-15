import React from 'react';
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@patternfly/react-core';

interface ErrorModalProps {
  title: string;
  errorMessage: string;
  isOpen: boolean;
  onClose: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({ title, errorMessage, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-label="Error details modal" variant="small">
      <ModalHeader title={title} />
      <ModalBody>
        <Content>
          <Content component="pre" style={{ whiteSpace: 'pre-wrap' }}>
            {errorMessage}
          </Content>
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button key="close" variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ErrorModal;
