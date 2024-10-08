import { DropdownItemProps } from '@patternfly/react-core/deprecated';

export type Action = {
  type?: string;
  key: string;
  label: React.ReactNode;
  hidden?: boolean;
  disabledTooltip?: React.ReactNode;
} & Omit<DropdownItemProps, 'label'>;

export type DetailsPageTabProps = {
  key: string;
  label: string;
  component?: React.ReactNode;
  isDisabled?: true;
  partial?: boolean;
  className?: string;
  isFilled?: boolean;
};
