import React from 'react';
import { Switch } from '@patternfly/react-core';
import BaseToggleField, { BaseToggleFieldProps } from '../BaseFields/BaseToggleField';

const SwitchField: React.FC<BaseToggleFieldProps> = (baseProps) => (
  <BaseToggleField {...baseProps}>{(props) => <Switch {...props} />}</BaseToggleField>
);

export default SwitchField;
