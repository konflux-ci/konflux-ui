import * as React from 'react';
import { Button, ModalVariant, Content } from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '../../../components/modal/createModalLauncher';
import { useModalLauncher } from '../../../components/modal/ModalProvider';

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

type TruncateModalProps = ComponentProps & {
  content: string;
};

const TruncateModal: React.FC<React.PropsWithChildren<TruncateModalProps>> = ({ content }) => {
  return (
    <Content>
      <Content component="p" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {content}
      </Content>
    </Content>
  );
};

export const Truncate: React.FC<TruncateProps> = ({
  content,
  modalTitle,
  maxLength = DEFAULT_MAX_LENGTH,
  expandInline = false,
  'data-test': dataTest,
}) => {
  const showModal = useModalLauncher();
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
      <Button
        variant="link"
        isInline
        onClick={() =>
          showModal(
            createModalLauncher(TruncateModal, {
              'data-test': dataTest ? `${dataTest}-modal` : 'truncate-modal',
              variant: ModalVariant.medium,
              title: modalTitle,
            })({ content }),
          )
        }
      >
        more
      </Button>
    </span>
  );
};
