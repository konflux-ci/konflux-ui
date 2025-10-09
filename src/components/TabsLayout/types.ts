export type TabProps = {
  key: string;
  label: React.ReactNode;
  component?: React.ReactNode;
  isDisabled?: true;
  partial?: boolean;
  className?: string;
  isFilled?: boolean;
};
