import * as React from 'react';
import { Modal, ModalProps as PFModalProps } from '@patternfly/react-core';

export type ModalProps = Omit<PFModalProps, 'children' | 'ref'>;

type ModalComponentProps = Omit<ModalProps, 'isOpen' | 'appendTo'> & {
  'data-testid': string;
};

type OnModalClose<D = unknown> = (obj?: D) => void;

export type ComponentProps<D = unknown> = {
  onClose?: (event?: KeyboardEvent | React.MouseEvent, obj?: D) => void;
};

export type RawComponentProps<D = unknown> = ComponentProps<D> & { modalProps?: ModalProps };

export type ModalLauncher<Result = Record<string, unknown>> = (
  onClose: OnModalClose<Result>,
) => React.ReactElement;

export const createRawModalLauncher =
  <D extends Record<string, unknown>, P extends ComponentProps<D>>(
    Component: React.ComponentType<React.PropsWithChildren<P & { modalProps?: ModalProps }>>,
    modalProps: ModalComponentProps,
  ) =>
  (componentProps?: P): ModalLauncher<D> =>
  (onModalClose) => {
    const { onClose, ...restModalProps } = modalProps;
    const handleClose = (event: KeyboardEvent | React.MouseEvent, obj?: unknown) => {
      onClose?.(event);
      onModalClose(obj as D);
    };

    return (
      <Component
        {...componentProps}
        modalProps={{
          'aria-label': 'modal',
          ...restModalProps,
          isOpen: true,
          onClose: handleClose,
          appendTo: () => document.querySelector('#hacDev-modal-container'),
        }}
        onClose={handleClose}
      />
    );
  };

export const createModalLauncher = <D extends Record<string, unknown>, P extends ComponentProps<D>>(
  Component: React.ComponentType<React.PropsWithChildren<P>>,
  inModalProps: ModalComponentProps,
) =>
  createRawModalLauncher(
    ({ modalProps, ...props }: P & { modalProps?: ModalProps }) => (
      <Modal {...modalProps}>
        {/* eslint-disable-next-line */}
        <Component {...(props as any)} />
      </Modal>
    ),
    inModalProps,
  );
