import { type FlagKey } from '~/feature-flags/flags';

export type TabProps = {
  key: string;
  label: string;
  component?: React.ReactNode;
  isDisabled?: true;
  partial?: boolean;
  className?: string;
  isFilled?: boolean;
  featureFlag?: FlagKey[];
};
