import * as React from 'react';

export type BoxProps = {
  children: React.ReactNode;
  className?: string;
};

export type LoadErrorProps = {
  label: string;
  className?: string;
  message?: string;
  canRetry?: boolean;
};

export type LoadingProps = {
  className?: string;
};

export type LoadingBoxProps = {
  className?: string;
  message?: string;
};

export type EmptyBoxProps = {
  label?: string;
};

export type MsgBoxProps = {
  title?: string;
  detail?: React.ReactNode;
  className?: string;
};

export type AccessDeniedProps = {
  message?: string;
};

export type DataProps = {
  NoDataEmptyMsg?: React.ComponentType<React.PropsWithChildren<unknown>>;
  EmptyMsg?: React.ComponentType<React.PropsWithChildren<unknown>>;
  label?: string;
  unfilteredData?: unknown;
  data?: unknown;
  children?: React.ReactNode;
};

export type StatusBoxProps = {
  label?: string;
  loadError?: unknown;
  loaded?: boolean;
  data?: unknown;
  unfilteredData?: unknown;
  skeleton?: React.ReactNode;
  NoDataEmptyMsg?: React.ComponentType<React.PropsWithChildren<unknown>>;
  EmptyMsg?: React.ComponentType<React.PropsWithChildren<unknown>>;
  children?: React.ReactNode;
};
