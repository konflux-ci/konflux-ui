import React from 'react';
import { AlertGroup } from '@patternfly/react-core';
import { ToastItem } from './ToastItem';
import type { ToastApi, ToastId, ToastOptions, ToastRecord, ToastVariant } from './types';
import './ToastProvider.scss';

const ToastContext = React.createContext<ToastApi | null>(null);

const defaultTimeoutForVariant: Record<ToastVariant, number | false> = {
  info: false,
  success: 5000,
  warning: false,
  danger: false,
};

const validateOptions = (options: Partial<ToastOptions>, requireTitle = false) => {
  if (
    (requireTitle || options.title !== undefined) &&
    (typeof options.title !== 'string' || options.title.trim().length === 0)
  ) {
    throw new Error('Toast title must be a non-empty string');
  }

  if (options.percentage !== undefined && options.percentage !== null) {
    if (
      !Number.isFinite(options.percentage) ||
      options.percentage < 0 ||
      options.percentage > 100
    ) {
      throw new Error('Toast percentage must be between 0 and 100');
    }
  }

  if (
    options.timeout !== undefined &&
    options.timeout !== false &&
    (!Number.isFinite(options.timeout) || options.timeout <= 0)
  ) {
    throw new Error('Toast timeout must be false or a positive finite number');
  }
};

const normalizeToast = (id: ToastId, options: ToastOptions): ToastRecord => {
  const variant = options.variant ?? 'info';
  const isDanger = variant === 'danger';

  return {
    id,
    title: options.title,
    variant,
    ...(options.description !== undefined && { description: options.description }),
    ...(typeof options.percentage === 'number' && { percentage: options.percentage }),
    timeout: isDanger ? false : (options.timeout ?? defaultTimeoutForVariant[variant]),
    isDismissible: isDanger ? true : (options.isDismissible ?? true),
    timerVersion: 0,
  };
};

export const useToast = (): ToastApi => {
  const toast = React.useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return toast;
};

export const ToastProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);
  const toastRecords = React.useRef(new Map<ToastId, ToastRecord>());
  const isActive = React.useRef(true);
  const providerId = React.useId();
  const nextToastId = React.useRef(0);

  React.useEffect(() => {
    isActive.current = true;
    const records = toastRecords.current;
    return () => {
      isActive.current = false;
      records.clear();
    };
  }, []);

  const addToast = React.useCallback(
    (options: ToastOptions): ToastId => {
      validateOptions(options, true);
      const id = `${providerId}-${nextToastId.current++}`;
      const toast = normalizeToast(id, options);
      if (!isActive.current) return id;

      toastRecords.current.set(id, toast);
      setToasts(Array.from(toastRecords.current.values()));
      return id;
    },
    [providerId],
  );

  const updateToast = React.useCallback((id: ToastId, patch: Partial<ToastOptions>): void => {
    if (!isActive.current) return;
    const existing = toastRecords.current.get(id);
    if (!existing) return;

    validateOptions(patch);
    const update = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    );
    const merged = { ...existing, ...update };
    const isDanger = merged.variant === 'danger';
    const updated: ToastRecord = {
      ...merged,
      ...(patch.timeout !== undefined && { timerVersion: existing.timerVersion + 1 }),
      ...(isDanger && { timeout: false, isDismissible: true }),
    };

    toastRecords.current.set(id, updated);
    setToasts(Array.from(toastRecords.current.values()));
  }, []);

  const removeToast = React.useCallback((id: ToastId): void => {
    if (!isActive.current || !toastRecords.current.has(id)) return;
    toastRecords.current.delete(id);
    setToasts(Array.from(toastRecords.current.values()));
  }, []);

  const value = React.useMemo<ToastApi>(
    () => ({ addToast, updateToast, removeToast }),
    [addToast, updateToast, removeToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <AlertGroup aria-label="Notifications" className="toast-alert-group" isLiveRegion isToast>
        {[...toasts].reverse().map((toast) => (
          <ToastItem key={toast.id} onRemove={removeToast} toast={toast} />
        ))}
      </AlertGroup>
    </ToastContext.Provider>
  );
};
