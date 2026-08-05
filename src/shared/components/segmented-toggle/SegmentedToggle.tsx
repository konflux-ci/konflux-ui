import * as React from 'react';
import { ToggleGroup, ToggleGroupItem, Tooltip } from '@patternfly/react-core';

export type SegmentedToggleOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  tooltip?: React.ReactNode;
  id?: string;
};

export type SegmentedToggleProps<T extends string> = {
  options: SegmentedToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  'aria-label': string;
  className?: string;
};

type SegmentedToggleItemProps<T extends string> = {
  option: SegmentedToggleOption<T>;
  isSelected: boolean;
  onChange: (value: T) => void;
};

const SegmentedToggleItem = <T extends string>({
  option,
  isSelected,
  onChange,
}: SegmentedToggleItemProps<T>) => {
  const [buttonEl, setButtonEl] = React.useState<HTMLElement | null>(null);

  React.useLayoutEffect(() => {
    setButtonEl(option.id ? document.getElementById(option.id) : null);
  }, [option.id]);

  return (
    <>
      {option.tooltip && buttonEl ? (
        <Tooltip content={option.tooltip} triggerRef={() => buttonEl} />
      ) : null}
      <ToggleGroupItem
        text={option.label}
        buttonId={option.id}
        isSelected={isSelected}
        onChange={() => onChange(option.value)}
      />
    </>
  );
};

export const SegmentedToggle = <T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  className,
}: SegmentedToggleProps<T>) => {
  return (
    <ToggleGroup aria-label={ariaLabel} className={className}>
      {options.map((option) => (
        <SegmentedToggleItem
          key={option.value}
          option={option}
          isSelected={option.value === value}
          onChange={onChange}
        />
      ))}
    </ToggleGroup>
  );
};
