import React from 'react';
import {
  Button,
  Flex,
  FlexItem,
  FormFieldGroupExpandable,
  FormFieldGroupHeader,
  TextInputTypes,
} from '@patternfly/react-core';
import { EyeIcon } from '@patternfly/react-icons/dist/esm/icons';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useField, useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { uniqueId } from 'lodash-es';
import { getRegistryCreds } from '~/utils/secrets/secret-utils';
import { useOptionalSecretEditSensitive } from './SecretEditSensitiveContext';

type MultiImageCredentialFormProps = {
  name: string;
  isEditMode?: boolean;
};

type RegistryCredential = {
  registry: string;
  username: string;
  password: string;
  email: string;
};

export const MultiImageCredentialForm: React.FC<
  React.PropsWithChildren<MultiImageCredentialFormProps>
> = ({ name, isEditMode = false }) => {
  const [{ value: fieldValues }] = useField<RegistryCredential[]>(name);
  const [uniqId, setUniqId] = React.useState(uniqueId());
  const { setFieldValue, getFieldProps } = useFormikContext();
  const sensitive = useOptionalSecretEditSensitive();

  const revealRegistryCredentialRow = React.useCallback(async () => {
    if (!sensitive) {
      return;
    }
    const s = await sensitive.requestFullSecret();
    if (!s) {
      return;
    }
    const creds = getRegistryCreds(s);
    const rows =
      creds.length > 0
        ? creds.map((row) => ({
            registry: row.registry,
            username: row.username,
            password: row.password,
            email: row.email,
          }))
        : [{ registry: '', username: '', password: '', email: '' }];
    void setFieldValue(name, rows);
  }, [name, sensitive, setFieldValue]);

  return (
    <FieldArray
      key={`${name}-${uniqId}`}
      name={name}
      render={(arrayHelpers) => (
        <>
          {fieldValues?.map((_v, idx) => (
            <FormFieldGroupExpandable
              key={`${idx.toString()}-${uniqId}`}
              toggleAriaLabel="Details"
              isExpanded
              header={
                <FormFieldGroupHeader
                  titleText={{ text: `Credentials ${idx + 1}`, id: `${idx.toString()}-${uniqId}` }}
                  actions={
                    fieldValues.length > 1 && (
                      <Button
                        type="button"
                        data-test="remove-credentials-button"
                        onClick={() => {
                          setUniqId(uniqueId());
                          arrayHelpers.remove(idx);
                        }}
                        variant="link"
                        icon={<MinusCircleIcon />}
                      >
                        {`Remove credentials ${idx + 1}`}
                      </Button>
                    )
                  }
                />
              }
            >
              <InputField
                name={`${name}.${idx.toString()}.registry`}
                label="Registry server address"
                helperText="For example quay.io or docker.io"
                isRequired
              />
              <InputField
                name={`${name}.${idx.toString()}.username`}
                label="Username"
                helperText="For image registry authentication"
                isRequired
              />
              <Flex
                alignItems={{ default: 'alignItemsFlexEnd' }}
                gap={{ default: 'gapMd' }}
                className="pf-v5-u-mb-md"
              >
                <FlexItem grow={{ default: 'grow' }}>
                  <InputField
                    name={`${name}.${idx.toString()}.password`}
                    label="Password"
                    type={TextInputTypes.password}
                    helperText="For image registry authentication"
                    placeholder={
                      isEditMode ? 'To keep the same password, leave this field blank' : ''
                    }
                    isRequired={!isEditMode}
                    onBlur={(e) => {
                      const fieldPath = `${name}.${idx.toString()}.password`;
                      getFieldProps(fieldPath).onBlur(e);
                      sensitive?.onSensitiveFieldBlur(fieldPath);
                    }}
                  />
                </FlexItem>
                {isEditMode && sensitive ? (
                  <FlexItem>
                    <Button
                      type="button"
                      variant="plain"
                      aria-label={`Reveal password for credentials ${idx + 1}`}
                      icon={<EyeIcon />}
                      isLoading={sensitive.isLoadingFullSecret}
                      onClick={() => void revealRegistryCredentialRow()}
                    />
                  </FlexItem>
                ) : null}
              </Flex>
              <InputField
                name={`${name}.${idx.toString()}.email`}
                label="Email"
                type={TextInputTypes.email}
              />
            </FormFieldGroupExpandable>
          ))}
          <Button
            className="pf-v5-u-text-align-left"
            onClick={() =>
              arrayHelpers.push({ registry: '', username: '', password: '', email: '' })
            }
            type="button"
            data-test="add-credentials-button"
            variant="link"
            icon={<PlusCircleIcon />}
          >
            Add another credentials
          </Button>
        </>
      )}
    />
  );
};
