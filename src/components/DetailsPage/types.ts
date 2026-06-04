import { DropdownItemProps } from '@patternfly/react-core';

export type Action = {
  type?: string;
  key: string;
  label: React.ReactNode;
  hidden?: boolean;
  disabledTooltip?: React.ReactNode;
  component?: React.ReactNode;
} & Omit<DropdownItemProps, 'label' | 'component'>;

export type DetailsPageTabProps = {
  key: string;
  label: string;
  isDisabled?: true;
  partial?: boolean;
  className?: string;
  isFilled?: boolean;
};
