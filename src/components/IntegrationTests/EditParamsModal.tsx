import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Button,
  ButtonType,
  ButtonVariant,
  Form,
  ModalVariant,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { Formik, FormikValues } from 'formik';
import { K8sQueryPatchResource } from '../../k8s';
import { IntegrationTestScenarioModel } from '../../models';
import { IntegrationTestScenarioKind, Param } from '../../types/coreBuildService';
import { ComponentProps, createModalLauncher } from '../modal/createModalLauncher';
import FormikParamsField from './FormikParamsField';
import { formatParams } from './IntegrationTestForm/utils/create-utils';

type EditParamsModalProps = ComponentProps & {
  intTest: IntegrationTestScenarioKind;
};

export const EditParamsModal: React.FC<React.PropsWithChildren<EditParamsModalProps>> = ({
  intTest,
  onClose,
}) => {
  const [error, setError] = React.useState<string>();

  const getFormParamValues = (params: Param[]) => {
    if (!params || !Array.isArray(params) || params?.length === 0) {
      return [];
    }
    const formParams = [];
    params.forEach((param) => {
      if (param.value) {
        formParams.push({ name: param.name, values: [param.value] });
      } else {
        formParams.push(param);
      }
    });
    return formParams;
  };

  const updateIntegrationTest = async (values: FormikValues) => {
    try {
      await K8sQueryPatchResource({
        model: IntegrationTestScenarioModel,
        queryOptions: {
          name: intTest.metadata.name,
          ns: intTest.metadata.namespace,
        },
        patches: [{ op: 'replace', path: '/spec/params', value: formatParams(values.params) }],
      });
      onClose(null, { submitClicked: true });
    } catch (e) {
      setError((e.message || e.toString()) as string);
    }
  };

  const onReset = () => {
    onClose(null, { submitClicked: false });
  };

  const initialParams = getFormParamValues(intTest?.spec?.params);

  return (
    <Formik
      onSubmit={updateIntegrationTest}
      initialValues={{ params: initialParams, confirm: false }}
      onReset={onReset}
    >
      {({ handleSubmit, handleReset, isSubmitting, values }) => {
        const isChanged = values.params !== initialParams;
        const showConfirmation = isChanged && values.strategy === 'Automatic';
        const isValid = isChanged && (showConfirmation ? values.confirm : true);

        return (
          <Form data-test="edit-params-modal">
            <Stack hasGutter>
              <StackItem>
                <FormikParamsField fieldName="params" heading="Show parameters" initExpanded />
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
                  data-test="update-resource"
                >
                  Save
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

export const createEditParamsModal = createModalLauncher(EditParamsModal, {
  'data-test': `edit-its-params`,
  variant: ModalVariant.medium,
  title: `Edit parameters`,
});
