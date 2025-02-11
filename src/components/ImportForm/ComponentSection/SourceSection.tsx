import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { useField, useFormikContext } from 'formik';
import { InputField, SwitchField } from 'formik-pf';
import GitUrlParse from 'git-url-parse';
import { useAllComponents } from '../../../hooks/useComponents';
import { detectGitType, GitProvider } from '../../../shared/utils/git-utils';
import { WorkspaceInfoProps } from '../../../types';
import { GIT_PROVIDER_ANNOTATION_VALUE } from '../../../utils/component-utils';
import { ImportFormValues } from '../type';
import GitOptions from './GitOptions';

export const SourceSection = ({ namespace, workspace }: WorkspaceInfoProps) => {
  const [, { touched, error }] = useField('source.git.url');
  const [isGitAdvancedOpen, setGitAdvancedOpen] = React.useState<boolean>(false);
  const { touched: touchedValues, setFieldValue } = useFormikContext<ImportFormValues>();
  const [allComponents] = useAllComponents(namespace, workspace);
  const validated = touched
    ? touched && !error
      ? ValidatedOptions.success
      : ValidatedOptions.error
    : ValidatedOptions.default;

  const getUniqueComponentName = React.useCallback(
    (name: string) => {
      return Array.isArray(allComponents) && allComponents.find((c) => c?.metadata?.name === name)
        ? `${name}-${Math.floor(Math.random() * 100)}`
        : name;
    },
    [allComponents],
  );

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
        let name: string;
        try {
          parsed = GitUrlParse(event.target?.value ?? '');
          await setFieldValue('gitURLAnnotation', parsed?.resource);
          name = parsed.name;
        } catch {
          name = '';
          await setFieldValue('gitURLAnnotation', '');
        }
        if (!touchedValues.componentName) {
          await setFieldValue('componentName', getUniqueComponentName(name));
        }
      }
    },
    [setFieldValue, touchedValues.componentName, validated, getUniqueComponentName],
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
