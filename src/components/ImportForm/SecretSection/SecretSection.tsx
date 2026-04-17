import React from 'react';
import {
  TextInputTypes,
  GridItem,
  Grid,
  FormSection,
  Flex,
  FlexItem,
  Button,
  ButtonVariant,
  ButtonType,
  Tooltip,
} from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons/dist/esm/icons/pencil-alt-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { Base64 } from 'js-base64';
import { IMPORT_SECRET_HELP_TEXT } from '~/consts/secrets';
import { IfFeature } from '~/feature-flags/hooks';
import { useSecrets } from '../../../hooks/useSecrets';
import { SecretModel } from '../../../models';
import TextColumnField from '../../../shared/components/formik-fields/text-column-field/TextColumnField';
import { useNamespace } from '../../../shared/providers/Namespace';
import {
  BuildTimeSecret,
  CurrentComponentRef,
  SecretFormValues,
  SecretType,
  SecretTypeDropdownLabel,
} from '../../../types';
import { AccessReviewResources } from '../../../types/rbac';
import { useAccessReviewForModels } from '../../../utils/rbac';
import { ButtonWithAccessTooltip } from '../../ButtonWithAccessTooltip';
import { useModalLauncher } from '../../modal/ModalProvider';
import { SecretModalLauncher } from '../../Secrets/SecretModalLauncher';
import { ImportFormValues } from '../type';

const accessReviewResources: AccessReviewResources = [{ model: SecretModel, verb: 'create' }];

type SecretSectionProps = {
  currentComponent?: null | CurrentComponentRef;
};

const SecretSection: React.FC<SecretSectionProps> = ({ currentComponent }) => {
  const [canCreateSecret] = useAccessReviewForModels(accessReviewResources);
  const showModal = useModalLauncher();
  const { values, setFieldValue } = useFormikContext<ImportFormValues>();
  const namespace = useNamespace();

  const [secrets, secretsLoaded] = useSecrets(namespace);

  const partnerTaskSecrets = React.useMemo((): BuildTimeSecret[] => {
    if (!secrets || !secretsLoaded) {
      return [];
    }
    return secrets.map((secret) => {
      const keyValuePairs = Object.keys(secret.data).map((key) => ({
        key,
        value: Base64.decode(secret.data[key]),
        readOnlyKey: true,
        readOnlyValue: true,
      }));

      return {
        type: secret.type as SecretType,
        name: secret.metadata.name,
        providerUrl: '',
        tokenKeyName: secret.metadata.name,
        opaque: [SecretType.dockercfg, SecretType.dockerconfigjson, SecretType.opaque].includes(
          secret.type as SecretType,
        )
          ? { keyValuePairs }
          : null,
        image: secret.type === SecretTypeDropdownLabel.image ? { authType: '' } : null,
      };
    });
  }, [secrets, secretsLoaded]);

  const onSubmit = React.useCallback(
    (secretValue: SecretFormValues) => {
      const allSecrets = [...(values.importSecrets ?? []), secretValue];
      const secretNames = [...(values.newSecrets ?? []), secretValue.secretName];
      void setFieldValue('importSecrets', allSecrets);
      void setFieldValue('newSecrets', secretNames);
    },
    [values.importSecrets, values.newSecrets, setFieldValue],
  );

  const openEditSecretModal = React.useCallback(
    (rowIndex: number) => {
      const initial = values.importSecrets?.[rowIndex];
      if (initial == null) {
        return;
      }
      showModal(
        SecretModalLauncher({
          // `newSecrets` entries are name strings; SecretForm treats cluster-backed rows as `BuildTimeSecret`.
          existingSecrets: [
            ...partnerTaskSecrets,
            ...(values.newSecrets ?? []),
          ] as BuildTimeSecret[],
          onSubmit: (secretValue: SecretFormValues) => {
            const nextImport = [...(values.importSecrets ?? [])];
            const nextNames = [...(values.newSecrets ?? [])];
            nextImport[rowIndex] = secretValue;
            nextNames[rowIndex] = secretValue.secretName;
            void setFieldValue('importSecrets', nextImport);
            void setFieldValue('newSecrets', nextNames);
          },
          currentComponent,
          initialSecret: initial,
          isEdit: true,
        }),
      );
    },
    [
      showModal,
      partnerTaskSecrets,
      values.importSecrets,
      values.newSecrets,
      setFieldValue,
      currentComponent,
    ],
  );

  return (
    <FormSection>
      <TextColumnField
        name="newSecrets"
        label="Build time secret"
        addLabel="Add secret"
        placeholder="Secret"
        helpText={IMPORT_SECRET_HELP_TEXT}
        noFooter
        isReadOnly
        onChange={(v) =>
          setFieldValue(
            'importSecrets',
            values.importSecrets.filter((vs) => v.includes(vs.secretName)),
          )
        }
      >
        {(props) => {
          const rowIndex = props.idx;
          const editTestId = `${props.name.replace('.', '-')}-edit-button`;

          return (
            <Grid>
              <GridItem span={6}>
                <InputField name={props.name} type={TextInputTypes.text} isDisabled />
              </GridItem>
              <GridItem span={6}>
                <Flex spaceItems={{ default: 'spaceItemsNone' }}>
                  <FlexItem>
                    <IfFeature flag="edit-secret-page">
                      <Tooltip content="Edit">
                        <Button
                          type={ButtonType.button}
                          variant={ButtonVariant.plain}
                          data-test={editTestId}
                          aria-label="Edit secret"
                          isDisabled={!canCreateSecret}
                          onClick={() => openEditSecretModal(rowIndex)}
                          style={{ paddingRight: 0 }}
                        >
                          <PencilAltIcon />
                        </Button>
                      </Tooltip>
                    </IfFeature>
                  </FlexItem>
                  <FlexItem>{props.removeButton}</FlexItem>
                </Flex>
              </GridItem>
            </Grid>
          );
        }}
      </TextColumnField>
      <ButtonWithAccessTooltip
        isInline
        type="button"
        variant="link"
        data-test="add-secret-button"
        icon={<PlusCircleIcon />}
        onClick={() =>
          showModal(
            SecretModalLauncher({
              existingSecrets: [
                ...partnerTaskSecrets,
                ...(values.newSecrets ?? []),
              ] as BuildTimeSecret[],
              onSubmit,
              currentComponent,
            }),
          )
        }
        isDisabled={!canCreateSecret}
        tooltip="You don't have access to add a secret"
      >
        Add secret
      </ButtonWithAccessTooltip>
    </FormSection>
  );
};
export default SecretSection;
