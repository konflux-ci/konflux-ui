import * as React from 'react';
import { Flex, FlexItem, Switch } from '@patternfly/react-core';
import { HelpTooltipIcon } from '~/shared';

export type ConformaToggleProps = {
  id: string;
  label: string;
  /** Explains what enabling the toggle changes; shown in a help tooltip. */
  helpText: string;
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  'data-test'?: string;
};

/**
 * Switch paired with a help tooltip, as used by the Conforma result toolbars.
 */
export const ConformaToggle: React.FC<ConformaToggleProps> = ({
  id,
  label,
  helpText,
  isChecked,
  onChange,
  'data-test': dataTest,
}) => (
  <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
    <FlexItem>
      <Switch
        id={id}
        label={label}
        isChecked={isChecked}
        onChange={(_event, checked) => onChange(checked)}
        data-test={dataTest ?? id}
      />
    </FlexItem>
    <FlexItem>
      <HelpTooltipIcon content={helpText} />
    </FlexItem>
  </Flex>
);
