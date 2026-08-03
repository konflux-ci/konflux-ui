import React from 'react';
import { HelperText, HelperTextItem, Title, TitleSizes } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import EncodedKeyValueFileInputField from './EncodedKeyValueUploadField';
import {
  useAreSecretSensitiveFieldsHidden,
  useOptionalSecretEditSensitive,
} from './SecretEditSensitiveContext';
import { SensitiveValuesRevealBanner } from './SensitiveValuesRevealBanner';

export const KeyValueSecretForm: React.FC = () => {
  const { setFieldValue } = useFormikContext();
  const sensitive = useOptionalSecretEditSensitive();
  const sensitiveFieldsHidden = useAreSecretSensitiveFieldsHidden();

  const revealOpaqueValues = React.useCallback(async () => {
    if (!sensitive) {
      return;
    }
    const s = await sensitive.requestFullSecret();
    if (!s?.data) {
      return;
    }
    const pairs = Object.entries(s.data).map(([key, value]) => ({
      key,
      value,
    }));
    void setFieldValue('opaque.keyValues', pairs.length > 0 ? pairs : [{ key: '', value: '' }]);
  }, [sensitive, setFieldValue]);

  return (
    <>
      <Title size={TitleSizes.md} headingLevel="h4">
        Key/value secret
        <HelperText style={{ fontWeight: 100 }}>
          <HelperTextItem variant="indeterminate">
            Key/value secrets let you inject sensitive data into your application as files or
            environment variables
          </HelperTextItem>
        </HelperText>
      </Title>
      <SensitiveValuesRevealBanner onReveal={revealOpaqueValues} />
      {!sensitiveFieldsHidden ? (
        <EncodedKeyValueFileInputField name="opaque.keyValues" data-test="secret-key-value-pair" />
      ) : null}
    </>
  );
};
