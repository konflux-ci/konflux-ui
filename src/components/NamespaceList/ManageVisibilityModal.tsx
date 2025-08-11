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
import { Formik, FormikHelpers } from 'formik';
import { RadioGroupField } from 'formik-pf';
import { K8sQueryCreateResource, K8sQueryDeleteResource, useK8sWatchResource } from '~/k8s';
import { RoleBindingModel, RoleBindingGroupVersionKind } from '~/models';
import { NamespaceKind, RoleBinding } from '~/types';

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

const PUBLIC_ROLE_BINDING_NAME = 'konflux-public-viewer';
const VIEWER_ROLE_NAME = 'konflux-viewer-user-actions';

const findPublicRoleBinding = (
  roleBindings: RoleBinding[] | undefined,
): RoleBinding | undefined => {
  return roleBindings?.find(
    (rb) =>
      rb.roleRef.name === VIEWER_ROLE_NAME &&
      rb.subjects?.some(
        (subject) => subject.kind === 'Group' && subject.name === 'system:authenticated',
      ),
  );
};

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

  const handleSubmit = async (values: FormValues, formikHelpers: FormikHelpers<FormValues>) => {
    setError(undefined);

    try {
      if (values.visibility === VisibilityOption.PUBLIC) {
        // Create the role binding to make namespace public
        const roleBinding: RoleBinding = {
          apiVersion: 'rbac.authorization.k8s.io/v1',
          kind: 'RoleBinding',
          metadata: {
            name: PUBLIC_ROLE_BINDING_NAME,
            namespace: namespace.metadata.name,
          },
          roleRef: {
            apiGroup: 'rbac.authorization.k8s.io',
            kind: 'ClusterRole',
            name: VIEWER_ROLE_NAME,
          },
          subjects: [
            {
              apiGroup: 'rbac.authorization.k8s.io',
              kind: 'Group',
              name: 'system:authenticated',
            },
          ],
        };

        await K8sQueryCreateResource({
          model: RoleBindingModel,
          resource: roleBinding,
          queryOptions: {
            ns: namespace.metadata.name,
          },
        });
      } else {
        // Delete the role binding to make namespace private
        const publicRoleBinding = findPublicRoleBinding(roleBindings);

        if (publicRoleBinding) {
          await K8sQueryDeleteResource({
            model: RoleBindingModel,
            queryOptions: {
              name: publicRoleBinding.metadata.name,
              ns: namespace.metadata.name,
            },
          });
        }
      }

      onClose();
    } catch (err) {
      setError(`Failed to save visibility setting: ${err.message || String(err)}`);
    } finally {
      formikHelpers.setSubmitting(false);
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
      {({ values, isSubmitting, handleSubmit: formikHandleSubmit }) => {
        const hasChanges = values.visibility !== currentVisibility;

        return (
          <Form>
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
                  variant="primary"
                  onClick={(e) => {
                    e.preventDefault();
                    formikHandleSubmit();
                  }}
                  isLoading={isSubmitting}
                  isDisabled={isLoading || !hasChanges || isSubmitting || !!roleBindingsError}
                  data-test="save-visibility"
                >
                  Save
                </Button>
                <Button variant={ButtonVariant.link} onClick={onClose} isDisabled={isSubmitting}>
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
