import { FormGroupProps, ValidatedOptions } from '@patternfly/react-core';

export type FieldProps = {
  name: string;
  isDisabled?: boolean;
  dataTest?: string;
  helperText?: string;
  helperTextInvalid?: string;
  validated?: ValidatedOptions;
} & Omit<FormGroupProps, 'children'>;
