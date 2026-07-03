import React from 'react';
import { Checkbox } from '@patternfly/react-core';
import BaseToggleField, { BaseToggleFieldProps } from '../BaseFields/BaseToggleField';

const CheckboxField: React.FC<BaseToggleFieldProps> = (baseProps) => (
  <BaseToggleField {...baseProps}>{(props) => <Checkbox {...props} />}</BaseToggleField>
);

export default CheckboxField;
