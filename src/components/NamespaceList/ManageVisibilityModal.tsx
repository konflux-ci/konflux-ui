import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Form,
  Alert,
  AlertVariant,
  ModalBoxBody,
} from '@patternfly/react-core';
import { Formik, FormikHelpers } from 'formik';
import { RadioGroupField } from 'formik-pf';
import { K8sQueryCreateResource, K8sQueryDeleteResource, useK8sWatchResource } from '../../k8s';
import { RoleBindingModel, RoleBindingGroupVersionKind } from '../../models';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { NamespaceKind, RoleBinding } from '../../types';
import { RawComponentProps } from '../modal/createModalLauncher';

type ManageVisibilityModalProps = RawComponentProps & {
  namespace: NamespaceKind;
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

const ManageVisibilityModal: React.FC<ManageVisibilityModalProps> = ({
  namespace,
  modalProps,
  onClose,
}) => {
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

    // Look for a role binding that binds system:authenticated to konflux-viewer-user-actions
    const publicRoleBinding = roleBindings.find(
      (rb) =>
        rb.roleRef.name === VIEWER_ROLE_NAME &&
        rb.subjects?.some(
          (subject) => subject.kind === 'Group' && subject.name === 'system:authenticated',
        ),
    );

    return publicRoleBinding ? VisibilityOption.PUBLIC : VisibilityOption.PRIVATE;
  }, [isLoading, roleBindingsError, roleBindings]);

  // Initial form values based on current visibility
  const initialValues: FormValues = React.useMemo(
    () => ({
      visibility: currentVisibility,
    }),
    [currentVisibility],
  );

  const handleSubmit = async (values: FormValues, formikHelpers: FormikHelpers<FormValues>) => {
    formikHelpers.setSubmitting(true);
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
        // Find the existing role binding from the current data
        const publicRoleBinding = roleBindings?.find(
          (rb) =>
            rb.roleRef.name === VIEWER_ROLE_NAME &&
            rb.subjects?.some(
              (subject) => subject.kind === 'Group' && subject.name === 'system:authenticated',
            ),
        );

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

  // Check if there's a loading error
  React.useEffect(() => {
    if (roleBindingsError) {
      setError(
        `Failed to load current visibility state: ${roleBindingsError.message || String(roleBindingsError)}`,
      );
    }
  }, [roleBindingsError]);

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit} enableReinitialize>
      {({ values, isSubmitting, handleSubmit: formikHandleSubmit }) => {
        const hasChanges = values.visibility !== currentVisibility;

        return (
          <Modal
            {...modalProps}
            variant={ModalVariant.small}
            title="Manage visibility"
            data-testid="manage-visibility-modal"
            description={
              <>
                Manage visibility for a namespace.{' '}
                <ExternalLink href="https://placeholder-url.com">
                  Learn more about namespace visibility.
                </ExternalLink>
              </>
            }
            actions={[
              <Button
                key="save"
                variant="primary"
                onClick={() => formikHandleSubmit()}
                isLoading={isSubmitting}
                isDisabled={isLoading || !hasChanges || isSubmitting}
              >
                Save
              </Button>,
              <Button key="cancel" variant="link" onClick={onClose} isDisabled={isSubmitting}>
                Cancel
              </Button>,
            ]}
          >
            <ModalBoxBody>
              {error && (
                <Alert variant={AlertVariant.danger} title="Error" isInline>
                  {error}
                </Alert>
              )}
              <Form>
                <RadioGroupField
                  name="visibility"
                  options={[
                    {
                      value: VisibilityOption.PRIVATE,
                      label: 'Private (Default)',
                    },
                    {
                      value: VisibilityOption.PUBLIC,
                      label: 'Public',
                    },
                  ]}
                  required={false}
                  isDisabled={isSubmitting}
                />
              </Form>
            </ModalBoxBody>
          </Modal>
        );
      }}
    </Formik>
  );
};

export default ManageVisibilityModal;
