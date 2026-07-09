import * as React from 'react';
import {
  Button,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
  Content,
} from '@patternfly/react-core';
import './Truncate.scss';

const DEFAULT_MAX_LENGTH = 80;

export type TruncateProps = {
  content: string;
  maxLength?: number;
  modalTitle?: string;
  /** When true, "more"/"less" toggle reveals the full text inline instead of opening a modal. */
  expandInline?: boolean;
  'data-test'?: string;
};

/**
 * Truncate component
 *
 * Displays text content, truncating it if it exceeds the specified maxLength.
 * Default: clicking "more" opens a modal with the full content.
 * With expandInline=true: clicking "more"/"less" reveals/hides the full text inline.
 */
export const Truncate: React.FC<TruncateProps> = ({
  content,
  modalTitle,
  maxLength = DEFAULT_MAX_LENGTH,
  expandInline = false,
  'data-test': dataTest,
}) => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const shouldTruncate = content.length > maxLength;

  if (!shouldTruncate) {
    return <span data-test={dataTest}>{content}</span>;
  }

  const truncatedText = `${content.slice(0, maxLength)}...`;

  if (expandInline) {
    return (
      <span data-test={dataTest}>
        <span className="truncate-text__inline-content">
          {isExpanded ? content : truncatedText}
        </span>{' '}
        <Button
          variant="link"
          isInline
          aria-expanded={isExpanded}
          onClick={() => setIsExpanded((prev) => !prev)}
        >
          {isExpanded ? 'less' : 'more'}
        </Button>
      </span>
    );
  }

  return (
    <span data-test={dataTest}>
      {truncatedText}
      <Button variant="link" isInline onClick={() => setIsModalOpen(true)}>
        more
      </Button>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-label={modalTitle || 'Full text'}
        variant={ModalVariant.medium}
        data-test={dataTest ? `${dataTest}-modal` : 'truncate-modal'}
      >
        {modalTitle && <ModalHeader title={modalTitle} />}
        <ModalBody>
          <Content className="truncate-text__modal-content">{content}</Content>
        </ModalBody>
      </Modal>
    </span>
  );
};
