import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';
import { InputField, SwitchField } from 'formik-pf';
import GitUrlParse from 'git-url-parse';
import { v4 as uuidv4 } from 'uuid';
import { detectGitType, GitProvider } from '../../../shared/utils/git-utils';
import { GIT_PROVIDER_ANNOTATION_VALUE } from '../../../utils/component-utils';
import { ImportFormValues } from '../type';
import GitOptions from './GitOptions';

export const SourceSection = () => {
  const [, { touched, error }] = useField('source.git.url');
  const [isGitAdvancedOpen, setGitAdvancedOpen] = React.useState<boolean>(false);
  const { touched: touchedValues, setFieldValue } = useFormikContext<ImportFormValues>();
  const validated = touched
    ? touched && !error
      ? ValidatedOptions.success
      : ValidatedOptions.error
    : ValidatedOptions.default;

  function generateRandomString(): string {
    let uniqueName: string;
    do {
      uniqueName = uuidv4()
        .replace(/[^a-z0-9-]/g, '')
        .substring(0, 5);
    } while (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(uniqueName));
    return uniqueName;
  }

  const handleChange = React.useCallback(
    async (event) => {
      if (validated) {
        const gitType = detectGitType(event.target?.value as string);
        if (gitType !== GitProvider.GITHUB && gitType !== GitProvider.GITLAB) {
          await setFieldValue('gitProviderAnnotation', '');
          setGitAdvancedOpen(true);
        }
        if (gitType === GitProvider.GITHUB) {
          await setFieldValue('gitProviderAnnotation', GIT_PROVIDER_ANNOTATION_VALUE.GITHUB);
          setGitAdvancedOpen(false);
        }
        if (gitType === GitProvider.GITLAB) {
          await setFieldValue('gitProviderAnnotation', GIT_PROVIDER_ANNOTATION_VALUE.GITLAB);
          setGitAdvancedOpen(false);
        }

        let parsed: GitUrlParse.GitUrl;
        try {
          parsed = GitUrlParse(event.target?.value ?? '');
          await setFieldValue('gitURLAnnotation', `https://${parsed?.resource}`);
        } catch {
          await setFieldValue('gitURLAnnotation', '');
        }
        if (!touchedValues.componentName) {
          await setFieldValue('componentName', generateRandomString());
        }
      }
    },
    [setFieldValue, touchedValues.componentName, validated],
  );

  return (
    <>
      <InputField
        name="source.git.url"
        label="Git repository url"
        placeholder="Enter your source"
        validated={validated}
        isRequired
        data-testid="enter-source"
        onChange={handleChange}
      />
      {validated === ValidatedOptions.success ? (
        <SwitchField name="isPrivateRepo" label="Should the image produced be private?" />
      ) : null}
      {validated === ValidatedOptions.success ? (
        <GitOptions isGitAdvancedOpen={isGitAdvancedOpen} setGitAdvancedOpen={setGitAdvancedOpen} />
      ) : null}
    </>
  );
};
