import * as React from 'react';
import {
  FormSection,
  Text,
  TextContent,
  TextVariants,
  ValidatedOptions,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { CheckboxField, InputField } from 'formik-pf';
import { RESOURCE_NAME_REGEX_MSG } from '../../../utils/validation-utils';
import ContextsField from '../ContextsField';
import FormikParamsField from '../FormikParamsField';

type Props = { isInPage?: boolean; edit?: boolean };

const IntegrationTestSection: React.FC<React.PropsWithChildren<Props>> = ({ isInPage, edit }) => {
  const [, { touched, error }] = useField<string>({
    name: 'integrationTest.url',
    type: 'input',
  });
  const validated = touched
    ? touched && !error
      ? ValidatedOptions.success
      : ValidatedOptions.error
    : ValidatedOptions.default;

  return (
    <>
      {!isInPage && (
        <>
          <TextContent data-test="integration-test-section-header">
            <Text component={TextVariants.h1}>Add integration test</Text>
            <Text component={TextVariants.p}>
              Test all your components after you commit code by adding an integration test.
              Integration tests run in parallel using temporary environments. Only validated
              versions of applications will be deployed.
            </Text>
          </TextContent>
        </>
      )}
      <FormSection>
        <InputField
          label="Integration test name"
          name="integrationTest.name"
          helperText={edit ? '' : RESOURCE_NAME_REGEX_MSG}
          data-test="display-name-input"
          isDisabled={edit}
          required
        />
        <InputField
          name="integrationTest.url"
          placeholder="Enter your source"
          validated={validated}
          label="Git URL"
          required
          data-test="git-url-input"
        />
        <InputField
          name="integrationTest.revision"
          label="Revision"
          helperText="Branch, tag or commit."
          data-test="git-revision"
        />
        <InputField
          name="integrationTest.path"
          label="Path in repository"
          helperText="Where to find the file in your repository."
          data-test="git-path-repo"
          required
        />
        <ContextsField fieldName="integrationTest.contexts" />
        <FormikParamsField fieldName="integrationTest.params" />

        <CheckboxField
          name="integrationTest.optional"
          aria-label="Mark as optional for release"
          label="Mark as optional for release"
          helperText="Passing this test is optional and cannot prevent the application from being released."
          data-test="optional-release-checkbox"
        />
      </FormSection>
    </>
  );
};

export default IntegrationTestSection;
