import React from 'react';
import { To, useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import { IntegrationTestScenarioKind, ResourceKind } from '../../../types/coreBuildService';
import IntegrationTestForm from './IntegrationTestForm';
import { IntegrationTestFormValues, IntegrationTestLabels } from './types';
import { editIntegrationTest, ResolverRefParams } from './utils/create-utils';
import { integrationTestValidationSchema } from './utils/validation-utils';

export interface FormContext {
  name: string;
  description: string;
  selected?: boolean;
}

type IntegrationTestViewProps = {
  integrationTest?: IntegrationTestScenarioKind | undefined | null;
  breadcrumbs: ({ name: string; path: string } | React.ReactElement)[];
  detailsPath: To;
  listPath: To;
  trackEvents: {
    editIntegrationTestSubmit: () => void;
    addIntegrationTestSubmit: () => void;
    integrationTestEditedOrCreated: (newIntegrationTest: IntegrationTestScenarioKind) => void;
    editIntegrationTestLeave: () => void;
    addIntegrationTestLeave: () => void;
  };
  createIntegrationTest: (
    integrationTestFormValues: IntegrationTestFormValues,
  ) => Promise<IntegrationTestScenarioKind>;
  defaultSelectedContextOption: FormContext;
};

export const getFormContextValues = (
  integrateTest: IntegrationTestScenarioKind | null | undefined,
  defaultSelectedContextOption: FormContext,
): FormContext[] => {
  const contexts = integrateTest?.spec?.contexts;
  // NOTE: If this is a new integration test,
  // have the 'application' context selected by default.
  if (!integrateTest) {
    return [defaultSelectedContextOption];
  } else if (!contexts?.length) {
    return [];
  }

  return contexts.map((context) => {
    return context.name ? { name: context.name, description: context.description } : context;
  });
};

const IntegrationTestView: React.FunctionComponent<
  React.PropsWithChildren<IntegrationTestViewProps>
> = ({
  integrationTest,
  breadcrumbs,
  detailsPath,
  listPath,
  trackEvents,
  createIntegrationTest,
  defaultSelectedContextOption,
}) => {
  const navigate = useNavigate();

  const url = integrationTest?.spec.resolverRef?.params?.find(
    (param) => param.name === ResolverRefParams.URL,
  );

  const revision = integrationTest?.spec.resolverRef?.params?.find(
    (param) => param.name === ResolverRefParams.REVISION,
  );

  const path = integrationTest?.spec.resolverRef?.params?.find(
    (param) => param.name === ResolverRefParams.PATH,
  );

  const getFormParamValues = (params) => {
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

  const initialValues = {
    integrationTest: {
      name: integrationTest?.metadata.name ?? '',
      url: url?.value ?? '',
      revision: revision?.value ?? '',
      path: path?.value ?? '',
      params: getFormParamValues(integrationTest?.spec?.params),
      contexts: getFormContextValues(integrationTest, defaultSelectedContextOption),
      optional: integrationTest?.metadata.labels?.[IntegrationTestLabels.OPTIONAL] === 'true',
      resourceKind: integrationTest?.spec?.resolverRef.resourceKind ?? ResourceKind.pipeline,
    },
    isDetected: true,
  };

  const handleSubmit = (values, actions) => {
    if (integrationTest) {
      trackEvents.editIntegrationTestSubmit();
    } else {
      trackEvents.addIntegrationTestSubmit();
    }
    return (
      integrationTest
        ? editIntegrationTest(integrationTest, values.integrationTest as IntegrationTestFormValues)
        : createIntegrationTest(values.integrationTest as IntegrationTestFormValues)
    )
      .then((newIntegrationTest) => {
        trackEvents.integrationTestEditedOrCreated(newIntegrationTest);
        if (integrationTest) {
          if (window.history.state && window.history.state.idx > 0) {
            // go back to the page where the edit was launched
            navigate(-1);
          } else {
            navigate(detailsPath);
          }
        } else {
          navigate(listPath);
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Error while submitting integration test:', error);
        actions.setSubmitting(false);
        actions.setStatus({ submitError: error.message });
      });
  };

  return (
    <Formik
      onSubmit={handleSubmit}
      onReset={() => {
        if (integrationTest) {
          trackEvents.editIntegrationTestLeave();
        } else {
          trackEvents.addIntegrationTestLeave();
        }
        navigate(-1);
      }}
      initialValues={initialValues}
      validationSchema={integrationTestValidationSchema}
    >
      {(props) => (
        <IntegrationTestForm {...props} breadcrumbs={breadcrumbs} edit={!!integrationTest} />
      )}
    </Formik>
  );
};

export default IntegrationTestView;
