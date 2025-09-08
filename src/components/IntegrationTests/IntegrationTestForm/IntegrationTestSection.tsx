import * as React from 'react';
import {
  FormSection,
  Text,
  TextContent,
  TextVariants,
  ValidatedOptions,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { CheckboxField, InputField, RadioGroupField } from 'formik-pf';
import HelpPopover from '~/components/HelpPopover';
import { LEARN_MORE_ABOUT_INTEGRATION_TESTS } from '~/consts/documentation';
import { ExternalLink } from '~/shared';
import { ResourceKind } from '~/types/coreBuildService';
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
              To test all your components after code commit, add an integration test. Integration
              tests run in parallel using temporary environments.
              <ExternalLink href={LEARN_MORE_ABOUT_INTEGRATION_TESTS} text="Learn more" icon />
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
          isRequired
        />
        <RadioGroupField
          name="integrationTest.resourceKind"
          isRequired
          label={
            <b>
              Where do we look for your integration test configurations ?{' '}
              <HelpPopover
                headerContent="Test pipeline definitions"
                bodyContent="This is where you can specify where Konflux should look for your integration test pipeline definitions."
              />
            </b>
          }
          options={[
            {
              value: ResourceKind.pipeline,
              label: 'Pipeline',
            },
            {
              value: ResourceKind.pipelineRun,
              label: 'Pipeline Run',
            },
          ]}
        />

        <InputField
          name="integrationTest.url"
          placeholder="Enter a GitHub or GitLab repository URL"
          validated={validated}
          label="Git Repository URL"
          isRequired
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
          label="Path in the repository"
          helperText="Where to find the file in your repository."
          data-test="git-path-repo"
          isRequired
        />

        <ContextsField fieldName="integrationTest.contexts" />
        <FormikParamsField fieldName="integrationTest.params" heading="Show Parameters" />

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
