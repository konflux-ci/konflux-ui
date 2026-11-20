import type { ReactNode } from 'react';

export type ToastId = string;

export type ToastVariant = 'info' | 'success' | 'warning' | 'danger';

export type ToastOptions = {
  title: string;
  variant?: ToastVariant;
  description?: ReactNode | null;
  percentage?: number | null;
  timeout?: number | false;
  isDismissible?: boolean;
};

export type ToastRecord = {
  id: ToastId;
  title: string;
  variant: ToastVariant;
  description?: ReactNode | null;
  percentage?: number | null;
  timeout: number | false;
  isDismissible: boolean;
  timerVersion: number;
};

export type ToastApi = {
  addToast: (options: ToastOptions) => ToastId;
  updateToast: (id: ToastId, patch: Partial<ToastOptions>) => void;
  removeToast: (id: ToastId) => void;
};
