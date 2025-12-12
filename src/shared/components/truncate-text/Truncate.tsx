import * as React from 'react';
import { Button, Modal, ModalVariant, Text, TextContent } from '@patternfly/react-core';

const DEFAULT_MAX_LENGTH = 80;

export type TruncateProps = {
  content: string;
  maxLength?: number;
  modalTitle?: string;
  'data-test'?: string;
};

/**
 * Truncate component
 *
 * Displays text content, truncating it if it exceeds the specified maxLength.
 * When truncated, clicking on 'more' opens a modal displaying the full content.
 */
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
        title={modalTitle}
        variant={ModalVariant.medium}
        data-test={dataTest ? `${dataTest}-modal` : 'truncate-modal'}
      >
        <TextContent>
          <Text style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{content}</Text>
        </TextContent>
      </Modal>
    </>
  );
};
