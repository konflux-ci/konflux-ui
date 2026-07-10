import * as React from 'react';
import { Button, Flex, FlexItem, Tooltip } from '@patternfly/react-core';

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
  name?: string;
  className?: string;
};

export const SegmentedToggle = <T extends string>({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  name,
  className,
}: SegmentedToggleProps<T>) => {
  return (
    <Flex gap={{ default: 'gapNone' }} role="group" aria-label={ariaLabel} className={className}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const button = (
          <Button
            id={option.id}
            type="button"
            name={name}
            variant={isSelected ? 'primary' : 'control'}
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </Button>
        );

        return (
          <FlexItem key={option.value}>
            {option.tooltip ? <Tooltip content={option.tooltip}>{button}</Tooltip> : button}
          </FlexItem>
        );
      })}
    </Flex>
  );
};
