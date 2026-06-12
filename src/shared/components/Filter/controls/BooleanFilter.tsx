import type { ChangeEvent } from 'react';
import { Switch, ToolbarItem } from '@patternfly/react-core';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { BooleanFilterConfig } from '../types';

/** Props for {@link BooleanFilter}. */
type BooleanFilterProps = {
  /** Boolean filter configuration. */
  config: BooleanFilterConfig;
};

/**
 * Boolean toggle-switch filter control.
 *
 * Renders a PatternFly `Switch`. The checked state is stored as a boolean
 * in the URL parameter via nuqs. When unchecked the parameter is removed
 * from the URL entirely.
 */
export const BooleanFilter = ({ config }: BooleanFilterProps) => {
  const { param, label } = config;

  const [isChecked, setIsChecked] = useQueryState(param, parseAsBoolean.withDefault(false));

  const handleChange = (_event: ChangeEvent<HTMLInputElement>, checked: boolean) => {
    void setIsChecked(checked || null);
  };

  return (
    <ToolbarItem>
      <Switch
        label={label}
        isChecked={isChecked}
        onChange={handleChange}
        data-test={`boolean-filter-${param}`}
      />
    </ToolbarItem>
  );
};
