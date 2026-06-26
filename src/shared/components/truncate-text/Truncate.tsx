import * as React from 'react';
import { Button, Content, ModalVariant } from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '../../../components/modal/createModalLauncher';
import { useModalLauncher } from '../../../components/modal/ModalProvider';

const DEFAULT_MAX_LENGTH = 80;

export type TruncateProps = {
  content: string;
  maxLength?: number;
  modalTitle?: string;
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
  'data-test': dataTest,
}) => {
  const showModal = useModalLauncher();

  const shouldTruncate = content.length > maxLength;

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
        onClick={() =>
          showModal(
            createModalLauncher(TruncateModal, {
              'data-test': dataTest ? `${dataTest}-modal` : 'truncate-modal',
              variant: ModalVariant.medium,
              title: modalTitle,
            })({ content }),
          )
        }
        data-test={dataTest}
        style={{ textAlign: 'left' }}
      >
        more
      </Button>
    </>
  );
};
