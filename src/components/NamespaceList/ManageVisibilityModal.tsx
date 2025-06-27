import * as React from 'react';
import { Button, Form, Modal, ModalVariant, Alert, AlertVariant } from '@patternfly/react-core';
import { Formik } from 'formik';
import { RadioGroupField } from 'formik-pf';
import {
  K8sQueryCreateResource,
  K8sQueryDeleteResource,
  K8sQueryListResourceItems,
  queryClient,
  createQueryKeys,
} from '../../k8s';
import { RoleBindingModel } from '../../models';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { NamespaceKind, RoleBinding } from '../../types';
import { RawComponentProps } from '../modal/createModalLauncher';

type ManageVisibilityModalProps = RawComponentProps & {
  namespace: NamespaceKind;
  refreshKey?: number;
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
  refreshKey,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string>();
  const [currentVisibility, setCurrentVisibility] = React.useState<VisibilityOption>(
    VisibilityOption.PRIVATE,
  );
  const [formValues, setFormValues] = React.useState<FormValues>({
    visibility: VisibilityOption.PRIVATE,
  });

  // Check current visibility state by looking for the role binding
  React.useEffect(() => {
    const checkCurrentVisibility = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        // Clear cache completely and wait
        const queryKey = createQueryKeys({
          model: RoleBindingModel,
          queryOptions: { ns: namespace.metadata.name },
        });

        queryClient.removeQueries({ queryKey });
        // Also clear all related queries
        queryClient.clear();

        // Small delay to ensure cache is cleared
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Make direct API call
        const roleBindings = await K8sQueryListResourceItems<RoleBinding[]>({
          model: RoleBindingModel,
          queryOptions: {
            ns: namespace.metadata.name,
          },
        });

        // Look for a role binding that binds system:authenticated to konflux-viewer-user-actions
        const publicRoleBinding = roleBindings.find(
          (rb) =>
            rb.roleRef.name === VIEWER_ROLE_NAME &&
            rb.subjects.some(
              (subject) => subject.kind === 'Group' && subject.name === 'system:authenticated',
            ),
        );

        const visibility = publicRoleBinding ? VisibilityOption.PUBLIC : VisibilityOption.PRIVATE;
        setCurrentVisibility(visibility);
        setFormValues({ visibility });
      } catch (err) {
        // Log error for debugging but don't show console in production
        setError(`Failed to load current visibility state: ${err.message || err}`);
      } finally {
        setIsLoading(false);
      }
    };

    // Always load state when component mounts or refreshKey changes
    void checkCurrentVisibility();
  }, [refreshKey, namespace.metadata.name]); // Depend on refreshKey and namespace to trigger refresh

  const handleSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
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
        // First, find the existing role binding
        const roleBindings = await K8sQueryListResourceItems<RoleBinding[]>({
          model: RoleBindingModel,
          queryOptions: {
            ns: namespace.metadata.name,
          },
        });

        const publicRoleBinding = roleBindings.find(
          (rb) =>
            rb.roleRef.name === VIEWER_ROLE_NAME &&
            rb.subjects.some(
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
      // Log error for debugging but don't show console in production
      setError(`Failed to save visibility setting: ${err.message || err}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = () => {
    void handleSubmit(formValues);
  };

  const hasChanges = formValues.visibility !== currentVisibility;

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
          onClick={handleSave}
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
      {error && (
        <Alert variant={AlertVariant.danger} title="Error" isInline>
          {error}
        </Alert>
      )}
      <Formik initialValues={formValues} onSubmit={handleSubmit} enableReinitialize>
        {({ values }) => {
          // Update parent state when form values change (moved outside hook)
          if (values.visibility !== formValues.visibility) {
            setFormValues(values);
          }

          return (
            <Form
              style={{
                paddingLeft: 'var(--pf-v5-c-modal-box__body--PaddingLeft)',
                paddingRight: 'var(--pf-v5-c-modal-box__body--PaddingRight)',
                paddingTop: 'var(--pf-v5-global--spacer--md)',
              }}
            >
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
          );
        }}
      </Formik>
    </Modal>
  );
};

export default ManageVisibilityModal;
