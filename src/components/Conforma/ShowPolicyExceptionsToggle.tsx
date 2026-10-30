import * as React from 'react';
import { ToolbarFilter } from '@patternfly/react-core';
import { ConformaToggle } from './ConformaToggle';
import type { PolicyExceptionFilter } from './usePolicyExceptionFilter';

const SHOW_POLICY_EXCEPTIONS_LABEL = 'Show policy exceptions';

/** Chip group the matched rule codes are listed under. */
const POLICY_EXCEPTION_LABEL_CATEGORY = 'Rule code';

const HELP_TEXT =
  'When enabled, the table is narrowed to the policy exception rules: exceptions that are expiring or already expired, those with an invalid config or no expiration, and rules that are pending enforcement.';

type ShowPolicyExceptionsToggleProps = {
  filter: PolicyExceptionFilter;
};

/**
 * Narrows a Conforma result table down to rules carrying a policy exception.
 * The matched rule codes are surfaced as toolbar labels so the applied filter
 * stays visible and individually removable, the same way the status and
 * component filters behave. Shared by SecurityConformaTab and
 * ConformaResultsTab so both render the same control and the same labels.
 */
export const ShowPolicyExceptionsToggle: React.FC<ShowPolicyExceptionsToggleProps> = ({
  filter,
}) => (
  <ToolbarFilter
    categoryName={POLICY_EXCEPTION_LABEL_CATEGORY}
    labels={filter.isChecked ? filter.ruleCodes : []}
    deleteLabel={(_category, label) =>
      filter.onRuleCodesChange(filter.ruleCodes.filter((code) => code !== String(label)))
    }
    deleteLabelGroup={() => filter.onChange(false)}
  >
    <ConformaToggle
      id="conforma-show-policy-exceptions"
      label={SHOW_POLICY_EXCEPTIONS_LABEL}
      helpText={HELP_TEXT}
      isChecked={filter.isChecked}
      onChange={filter.onChange}
    />
  </ToolbarFilter>
);
