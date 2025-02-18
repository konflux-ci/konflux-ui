import React from 'react';
import {
  Chip,
  ChipGroup,
  FormGroup,
  FormHelperText,
  FormSection,
  HelperText,
  HelperTextItem,
  TextInputGroup,
  TextInputGroupMain,
} from '@patternfly/react-core';
import { useField } from 'formik';
import HelpPopover from '../../../components/HelpPopover';
import { getFieldId } from '../../../shared/components/formik-fields/field-utils';
import { useDebounceCallback } from '../../../shared/hooks/useDebounceCallback';
import { validateUsername } from './form-utils';

import './UsernameSection.scss';

type Props = {
  disabled?: boolean;
};

const usernameRegex = /^[-_a-zA-Z0-9.]{2,45}$/;

export const UsernameSection: React.FC<React.PropsWithChildren<Props>> = ({ disabled }) => {
  const [, { value: usernames, error }, { setValue, setError }] = useField<string[]>('usernames');
  const fieldId = getFieldId('usernames', 'input');
  const [username, setUsername] = React.useState('');
  const [validHelpText, setValidHelpText] = React.useState('');
  const [validating, setValidating] = React.useState(false);

  const debouncedValidate = useDebounceCallback(
    React.useCallback(() => {
      setValidating(true);
      setValidHelpText('');
      setError('');
      if (!username) {
        setValidating(false);
        return;
      }
      if (!usernameRegex.test(username)) {
        setValidating(false);
        setError('Invalid username format.');
        return;
      }
      void validateUsername(username).then((valid) => {
        setValidating(false);
        if (valid) {
          setError('');
          setValidHelpText('Validated');
          if (!usernames.includes(username)) {
            void setValue([...usernames, username]);
          }
          setUsername('');
        } else {
          setError('Username not found.');
        }
      });
    }, [setError, setValue, username, usernames]),
  );

  return (
    <FormSection title="Add users">
      <FormGroup
        fieldId={fieldId}
        label="Enter usernames"
        labelIcon={
          <HelpPopover
            aria-label="Usernames in Konflux"
            headerContent="Usernames in Konflux"
            bodyContent="Your username is the name of your default namespace. To find a list of your namespaces, navigate to the Applications pane and select the options icon in the breadcrumb navigation."
          />
        }
        isRequired
      >
        <TextInputGroup className="username-section" isDisabled={disabled}>
          <TextInputGroupMain
            type="search"
            placeholder="Enter username"
            data-test="username-input"
            aria-label="Enter username"
            value={username}
            onChange={(_, v) => {
              setUsername(v);
              debouncedValidate();
            }}
          >
            <ChipGroup>
              {usernames.map((name) => (
                <Chip
                  closeBtnAriaLabel="Remove"
                  key={name}
                  onClick={() => setValue(usernames.filter((n) => n !== name))}
                >
                  {name}
                </Chip>
              ))}
            </ChipGroup>
          </TextInputGroupMain>
        </TextInputGroup>
        <FormHelperText>
          <HelperText>
            {validating ? (
              <HelperTextItem variant="warning" hasIcon>
                Validating...
              </HelperTextItem>
            ) : error ? (
              <HelperTextItem variant="error" hasIcon>
                {error}
              </HelperTextItem>
            ) : validHelpText ? (
              <HelperTextItem variant="success" hasIcon>
                {validHelpText}
              </HelperTextItem>
            ) : (
              <HelperTextItem>
                Provide Konflux usernames for the users you want to invite.
              </HelperTextItem>
            )}
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </FormSection>
  );
};
