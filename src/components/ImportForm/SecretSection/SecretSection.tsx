import React from 'react';
import { TextInputTypes, GridItem, Grid, FormSection } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { Base64 } from 'js-base64';
import { FLAGS } from '~/feature-flags/flags';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useSecrets } from '../../../hooks/useSecrets';
import { SecretModel } from '../../../models';
import TextColumnField from '../../../shared/components/formik-fields/text-column-field/TextColumnField';
import { useNamespace } from '../../../shared/providers/Namespace';
import {
  BuildTimeSecret,
  CurrentComponentRef,
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
  const isBuildServiceAccountFeatureOn = useIsOnFeatureFlag(FLAGS.buildServiceAccount.key);
  const [canCreateSecret] = useAccessReviewForModels(accessReviewResources);
  const showModal = useModalLauncher();
  const { values, setFieldValue } = useFormikContext<ImportFormValues>();
  const namespace = useNamespace();

  const [secrets, secretsLoaded] = useSecrets(namespace);
  const secretHelpText =
    isBuildServiceAccountFeatureOn === true
      ? 'Keep your data secure by defining a build time secret. Secrets are stored at the component level, allowing both this component and any linking components to access them.'
      : 'Keep your data secure by defining a build time secret. Secrets are stored at a namespace level so applications within namespace will have access to these secrets.';

  const partnerTaskSecrets: BuildTimeSecret[] =
    secrets && secretsLoaded
      ? secrets?.map((secret) => {
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
            image: secret.type === SecretTypeDropdownLabel.image ? { keyValuePairs } : null,
          };
        })
      : [];

  const onSubmit = React.useCallback(
    (secretValue) => {
      const allSecrets = [...values.importSecrets, secretValue];
      const secretNames = [...values.newSecrets, secretValue.secretName];
      void setFieldValue('importSecrets', allSecrets);
      void setFieldValue('newSecrets', secretNames);
    },
    [values, setFieldValue],
  );

  return (
    <FormSection>
      <TextColumnField
        name="newSecrets"
        label="Build time secret"
        addLabel="Add secret"
        placeholder="Secret"
        helpText={secretHelpText}
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
          return (
            <Grid>
              <GridItem span={6}>
                <InputField name={props.name} type={TextInputTypes.text} isDisabled />
              </GridItem>
              <GridItem span={6}>{props.removeButton}</GridItem>
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
            SecretModalLauncher(
              [...partnerTaskSecrets, ...values.newSecrets], // existingSecrets
              onSubmit,
              undefined, // onClose
              currentComponent, // currentComponent
            ),
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
