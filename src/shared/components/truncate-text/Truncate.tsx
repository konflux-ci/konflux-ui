import * as React from 'react';
import {
  Button,
  Content,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';

const DEFAULT_MAX_LENGTH = 80;

export type TruncateProps = {
  content: string;
  maxLength?: number;
  modalTitle?: string;
  'data-test'?: string;
};

export const Truncate: React.FC<TruncateProps> = ({
  content,
  modalTitle,
  maxLength = DEFAULT_MAX_LENGTH,
  'data-test': dataTest,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const shouldTruncate = content.length > maxLength;

  const handleOpen = () => setIsModalOpen(true);
  const handleClose = () => setIsModalOpen(false);

  if (!shouldTruncate) {
    return <span data-test={dataTest}>{content}</span>;
  }

  const truncatedText = `${content.slice(0, maxLength)}...`;

  return (
    <>
      {truncatedText}
      <Button
        variant="link"
        isInline
        onClick={handleOpen}
        data-test={dataTest}
        style={{ textAlign: 'left' }}
      >
        more
      </Button>
      <Modal
        isOpen={isModalOpen}
        onClose={handleClose}
        variant={ModalVariant.medium}
        data-test={dataTest ? `${dataTest}-modal` : 'truncate-modal'}
      >
        {modalTitle && <ModalHeader title={modalTitle} />}
        <ModalBody>
          <Content>
            <Content component="p" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {content}
            </Content>
          </Content>
        </ModalBody>
      </Modal>
    </>
  );
};
