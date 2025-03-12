import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  Form,
  FormHelperText,
  ModalVariant,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  ValidatedOptions,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { InputField } from 'formik-pf';
import { K8sQueryDeleteResource } from '../../k8s';
import { K8sModelCommon, K8sResourceCommon } from '../../types/k8s';
import { useWorkspaceInfo } from '../Workspace/useWorkspaceInfo';
import { ComponentProps, createModalLauncher } from './createModalLauncher';

type DeleteResourceModalProps = ComponentProps & {
  obj: K8sResourceCommon;
  model: K8sModelCommon;
  displayName?: string;
  isEntryNotRequired?: boolean;
  description?: React.ReactNode;
  submitCallback?: (obj: unknown, namespace?: string, workspace?: string) => void;
};

export const DeleteResourceModal: React.FC<React.PropsWithChildren<DeleteResourceModalProps>> = ({
  obj,
  model,
  onClose,
  displayName,
  isEntryNotRequired = false,
  description,
  submitCallback,
}) => {
  const [error, setError] = React.useState<string>();
  const resourceName = displayName || obj.metadata.name;
  const { workspace } = useWorkspaceInfo();
  const deleteResource = async () => {
    setError(null);
    try {
      await K8sQueryDeleteResource({
        model,
        queryOptions: {
          name: obj.metadata.name,
          ns: obj.metadata.namespace,
        },
      });
      submitCallback && submitCallback(obj, obj.metadata?.namespace, workspace);
      onClose(null, { submitClicked: true });
    } catch (e) {
      setError((e.message || e.toString()) as string);
    }
  };

  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  return (
    <Formik onSubmit={deleteResource} initialValues={{ resourceName: '' }} onReset={onReset}>
      {({
        handleSubmit,
        handleReset,
        values,
        isSubmitting,
        touched: { resourceName: touched },
      }) => {
        const input = values.resourceName;
        const isValid = input === resourceName;
        const helpText =
          touched && !input ? (
            <FormHelperText className="pf-m-warning">{obj.kind} name missing</FormHelperText>
          ) : undefined;
        const validatedState = touched
          ? !input
            ? ValidatedOptions.warning
            : isValid
              ? ValidatedOptions.success
              : ValidatedOptions.error
          : undefined;

        return (
          <Form>
            <Stack hasGutter>
              <StackItem>
                <TextContent>
                  <Text component={TextVariants.p}>
                    {description ? (
                      description
                    ) : (
                      <>
                        The {obj.kind} <strong>{resourceName}</strong> will be deleted.
                      </>
                    )}
                  </Text>
                </TextContent>
              </StackItem>
              {!isEntryNotRequired && (
                <StackItem>
                  <InputField
                    name="resourceName"
                    label={`Type "${resourceName}" to confirm deletion`}
                    helperTextInvalid={`${obj.kind} name does not match`}
                    helperText={helpText as unknown as string}
                    validated={validatedState}
                    autoComplete="off"
                    autoFocus
                    required
                  />
                </StackItem>
              )}
              <StackItem>
                {error && (
                  <Alert isInline variant={AlertVariant.danger} title="An error occurred">
                    {error}
                  </Alert>
                )}
                <Button
                  type={ButtonType.submit}
                  variant={ButtonVariant.danger}
                  isLoading={isSubmitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  isDisabled={!isEntryNotRequired && (!isValid || isSubmitting)}
                  data-test="delete-resource"
                >
                  Delete
                </Button>
                <Button variant={ButtonVariant.link} onClick={handleReset}>
                  Cancel
                </Button>
              </StackItem>
            </Stack>
          </Form>
        );
      }}
    </Formik>
  );
};

export const createDeleteModalLauncher = (kind: string) =>
  createModalLauncher(DeleteResourceModal, {
    'data-test': `delete-${kind}-modal`,
    variant: ModalVariant.small,
    title: `Delete ${kind}?`,
    titleIconVariant: 'warning',
  });
