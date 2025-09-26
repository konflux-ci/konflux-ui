import { DropdownItemProps } from '@patternfly/react-core/deprecated';
import { FlagKey } from '~/feature-flags/flags';

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
  isDisabled?: true;
  partial?: boolean;
  className?: string;
  isFilled?: boolean;
  unstableFeature?: FlagKey;
};
