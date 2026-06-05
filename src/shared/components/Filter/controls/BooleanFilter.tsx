import { Switch, ToolbarItem } from '@patternfly/react-core';
import { parseAsBoolean, useQueryState } from 'nuqs';
import { BooleanFilterConfig } from '../types';

type BooleanFilterProps = {
  config: BooleanFilterConfig;
};

export const BooleanFilter = ({ config }: BooleanFilterProps) => {
  const { param, label } = config;

  const [isChecked, setIsChecked] = useQueryState(param, parseAsBoolean.withDefault(false));

  const handleChange = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
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
