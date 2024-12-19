import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik, FormikValues } from 'formik';
import { k8sPatchResource } from '../../k8s/k8s-fetch';
import { IntegrationTestScenarioModel } from '../../models';
import { IntegrationTestScenarioKind, Context } from '../../types/coreBuildService';
import { ComponentProps, createModalLauncher } from '../modal/createModalLauncher';
import ContextsField from './ContextsField';
import { UnformattedContexts, formatContexts } from './IntegrationTestForm/utils/create-utils';
import { contextModalValidationSchema } from './utils/validation-utils';

type EditContextsModalProps = ComponentProps & {
  intTest: IntegrationTestScenarioKind;
};

export const EditContextsModal: React.FC<React.PropsWithChildren<EditContextsModalProps>> = ({
  intTest,
  onClose,
}) => {
  const [error, setError] = React.useState<string>();

  const getFormContextValues = (contexts: Context[] = []) => {
    return contexts.map(({ name, description }) => ({ name, description }));
  };

  const updateIntegrationTest = async (values: FormikValues) => {
    try {
      await k8sPatchResource({
        model: IntegrationTestScenarioModel,
        queryOptions: {
          name: intTest.metadata.name,
          ns: intTest.metadata.namespace,
        },
        patches: [
          {
            op: 'replace',
            path: '/spec/contexts',
            value: formatContexts(values.contexts as UnformattedContexts),
          },
        ],
      });
      onClose(null, { submitClicked: true });
    } catch (e) {
      const errMsg = e.message || e.toString();
      setError(errMsg as string);
    }
  };

  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  const initialContexts = getFormContextValues(intTest?.spec?.contexts);

  // When a user presses enter, make sure the form doesn't submit.
  // Enter should be used to select values from the drop down,
  // when using the keyboard, not submit the form.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission on Enter key
    }
  };

  return (
    <Formik
      onSubmit={updateIntegrationTest}
      initialValues={{ contexts: initialContexts, confirm: false }}
      onReset={onReset}
      validationSchema={contextModalValidationSchema}
    >
      {({ handleSubmit, handleReset, isSubmitting, values }) => {
        const isChanged = values.contexts !== initialContexts;
        const isPopulated = values.contexts.length > 0;
        const isValid = isChanged && isPopulated;

        return (
          <div data-test={'edit-contexts-modal'} onKeyDown={handleKeyDown}>
            <Stack hasGutter>
              <StackItem>
                <ContextsField fieldName="contexts" />
              </StackItem>
              <StackItem>
                {error && (
                  <Alert isInline variant={AlertVariant.danger} title="An error occurred">
                    {error}
                  </Alert>
                )}
                <Button
                  type={ButtonType.submit}
                  isLoading={isSubmitting}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }}
                  isDisabled={!isValid || isSubmitting}
                  data-test={'update-contexts'}
                >
                  Save
                </Button>
                <Button
                  variant={ButtonVariant.link}
                  onClick={handleReset}
                  data-test={'cancel-update-contexts'}
                >
                  Cancel
                </Button>
              </StackItem>
            </Stack>
          </div>
        );
      }}
    </Formik>
  );
};

export const createEditContextsModal = createModalLauncher(EditContextsModal, {
  'data-test': `edit-its-contexts`,
  variant: ModalVariant.medium,
  title: `Edit contexts`,
});
