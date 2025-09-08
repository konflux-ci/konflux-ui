import * as React from 'react';
import {
  Button,
  Form,
  Alert,
  AlertVariant,
  Stack,
  StackItem,
  ButtonVariant,
} from '@patternfly/react-core';
import { Formik } from 'formik';
import { RadioGroupField } from 'formik-pf';
import { useK8sWatchResource } from '~/k8s';
import { RoleBindingGroupVersionKind, RoleBindingModel } from '~/models';
import { NamespaceKind, RoleBinding } from '~/types';
import {
  findPublicRoleBinding,
  createPublicRoleBinding,
  deletePublicRoleBinding,
} from '~/utils/namespace-visibility-utils';

type ManageVisibilityModalProps = {
  namespace: NamespaceKind;
  onClose?: () => void;
};

enum VisibilityOption {
  PRIVATE = 'private',
  PUBLIC = 'public',
}

interface FormValues {
  visibility: VisibilityOption;
}

const ManageVisibilityModal: React.FC<ManageVisibilityModalProps> = ({ namespace, onClose }) => {
  const [error, setError] = React.useState<string>();

  // Use useK8sWatchResource to watch role bindings in the namespace
  const {
    data: roleBindings,
    isLoading,
    error: roleBindingsError,
  } = useK8sWatchResource<RoleBinding[]>(
    {
      groupVersionKind: RoleBindingGroupVersionKind,
      namespace: namespace.metadata.name,
      isList: true,
      watch: true,
    },
    RoleBindingModel,
  );

  // Memoize the current visibility state based on role bindings
  const currentVisibility = React.useMemo(() => {
    if (isLoading || roleBindingsError || !roleBindings) {
      return VisibilityOption.PRIVATE;
    }

    const publicRoleBinding = findPublicRoleBinding(roleBindings);
    return publicRoleBinding ? VisibilityOption.PUBLIC : VisibilityOption.PRIVATE;
  }, [isLoading, roleBindingsError, roleBindings]);

  // Initial form values based on current visibility
  const initialValues: FormValues = {
    visibility: currentVisibility,
  };

  const handleSubmit = async (values: FormValues) => {
    setError(undefined);

    try {
      if (values.visibility === VisibilityOption.PUBLIC) {
        // Create the role binding to make namespace public
        await createPublicRoleBinding(namespace.metadata.name);
      } else {
        // Delete the role binding to make namespace private
        const publicRoleBinding = findPublicRoleBinding(roleBindings);

        if (publicRoleBinding) {
          await deletePublicRoleBinding(namespace.metadata.name, publicRoleBinding);
        }
      }
      onClose?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Failed to save visibility setting: ${message}`);
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
      {({ values, isSubmitting, handleSubmit: formikHandleSubmit }) => {
        const hasChanges = values.visibility !== currentVisibility;

        return (
          <Form onSubmit={formikHandleSubmit}>
            <Stack hasGutter>
              <StackItem>
                {(error || roleBindingsError) && (
                  <Alert variant={AlertVariant.danger} title="Error" isInline>
                    {error ||
                      `Failed to load current visibility state: ${roleBindingsError?.message || String(roleBindingsError)}`}
                  </Alert>
                )}
              </StackItem>
              <StackItem>
                <RadioGroupField
                  name="visibility"
                  options={[
                    {
                      value: VisibilityOption.PRIVATE,
                      label: 'Private (Default)',
                      isDisabled: isSubmitting || !!roleBindingsError,
                    },
                    {
                      value: VisibilityOption.PUBLIC,
                      label: 'Public',
                      isDisabled: isSubmitting || !!roleBindingsError,
                    },
                  ]}
                  required={false}
                />
              </StackItem>
              <StackItem>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isSubmitting}
                  isDisabled={isLoading || !hasChanges || isSubmitting || !!roleBindingsError}
                  data-test="save-visibility"
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant={ButtonVariant.link}
                  onClick={onClose}
                  isDisabled={isSubmitting}
                >
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

export default ManageVisibilityModal;
