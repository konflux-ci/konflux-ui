import * as React from 'react';
import { useFormikContext } from 'formik';
import { DropdownItemObject } from '../../shared/components/dropdown/BasicDropdown';
import DropdownField from '../../shared/components/formik-fields/DropdownField';
import { SecretFormValues, SecretTypeDropdownLabel } from '../../types';
import './SecretTypeSelector.scss';

type SecretTypeSelectorProps = {
  onChange: (type: string) => void;
  isDisabled?: boolean;
  dropdownItems: DropdownItemObject[];
};

const SecretTypeSelector: React.FC<React.PropsWithChildren<SecretTypeSelectorProps>> = ({
  onChange,
  isDisabled,
  dropdownItems,
}) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<SecretFormValues>();

  const setValues = React.useCallback(
    (type: SecretTypeDropdownLabel) => {
      void setFieldValue('type', type);
      void setFieldTouched('type', true);
      onChange && onChange(type);
    },
    [onChange, setFieldValue, setFieldTouched],
  );
  const title =
    dropdownItems.find(({ value }) => value === values.type)?.value || dropdownItems[0]?.value;

  return (
    <DropdownField
      name="type"
      label="Secret type"
      className="secret-type-selector__dropdown"
      data-test="secret-type-selector"
      helpText="Tell us the secret type you want to add"
      items={dropdownItems}
      title={title}
      onChange={(type: SecretTypeDropdownLabel) => setValues(type)}
      isDisabled={isDisabled}
      fullWidth
      required
    />
  );
};
export default SecretTypeSelector;
