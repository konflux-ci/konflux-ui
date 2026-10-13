import * as React from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import { ConformaToggle } from './ConformaToggle';

const HELP_TEXT =
  'When enabled, the table is narrowed to upcoming policy changes: rules whose exception is about to lapse, and rules that start being enforced on a future date.';

type ShowPolicyExceptionsToggleProps = {
  isChecked: boolean;
  onChange: (checked: boolean) => void;
  /** Rule codes the table is currently narrowed to; shown as removable labels. */
  ruleCodes?: string[];
  /** Called with the remaining codes when one is removed. */
  onRuleCodesChange?: (codes: string[]) => void;
};

/**
 * Narrows a Conforma result table down to rules with an upcoming policy change.
 * The matched rule codes are surfaced as toolbar labels so the applied filter
 * stays visible and individually removable, the same way the status and
 * component filters behave.
 */
export const ShowPolicyExceptionsToggle: React.FC<ShowPolicyExceptionsToggleProps> = ({
  isChecked,
  onChange,
  ruleCodes = [],
  onRuleCodesChange,
}) => (
  <ToolbarFilter
    categoryName="Rule"
    labels={isChecked ? ruleCodes : []}
    deleteLabel={(_category, label) =>
      onRuleCodesChange?.(ruleCodes.filter((code) => code !== String(label)))
    }
    deleteLabelGroup={() => onChange(false)}
  >
    <ConformaToggle
      id="conforma-show-policy-exceptions"
      label="Show policy exceptions"
      helpText={HELP_TEXT}
      isChecked={isChecked}
      onChange={onChange}
    />
  </ToolbarFilter>
);
