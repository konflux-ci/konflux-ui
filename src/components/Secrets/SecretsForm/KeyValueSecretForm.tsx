import React from 'react';
import {
  Alert,
  Button,
  HelperText,
  HelperTextItem,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons';
import { useFormikContext } from 'formik';
import EncodedKeyValueFileInputField from './EncodedKeyValueUploadField';
import { useOptionalSecretEditSensitive } from './SecretEditSensitiveContext';

type KeyValueSecretFormProps = {
  isEditMode?: boolean;
};

export const KeyValueSecretForm: React.FC<KeyValueSecretFormProps> = ({ isEditMode = false }) => {
  const { setFieldValue } = useFormikContext();
  const sensitive = useOptionalSecretEditSensitive();

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
      {isEditMode && sensitive ? (
        <Alert
          variant="info"
          isInline
          title="Sensitive values are hidden"
          className="pf-v5-u-mb-md"
        >
          <Button
            type="button"
            variant="secondary"
            icon={<EyeIcon />}
            isLoading={sensitive.isLoadingFullSecret}
            onClick={() => void revealOpaqueValues()}
          >
            Reveal secret values
          </Button>
        </Alert>
      ) : null}
      <EncodedKeyValueFileInputField
        name="opaque.keyValues"
        data-test="secret-key-value-pair"
        isEditMode={isEditMode}
      />
    </>
  );
};
