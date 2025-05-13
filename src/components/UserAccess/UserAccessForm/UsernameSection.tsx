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
  Alert,
  AlertVariant,
} from '@patternfly/react-core';
import { useField } from 'formik';
import HelpPopover from '../../../components/HelpPopover';
import { getFieldId } from '../../../shared/components/formik-fields/field-utils';
import { useDebounceCallback } from '../../../shared/hooks/useDebounceCallback';
import './UsernameSection.scss';
import { konfluxUsernameYupValidation } from '../../../utils/validation-utils';

type Props = {
  disabled?: boolean;
};

export const UsernameSection: React.FC<React.PropsWithChildren<Props>> = ({ disabled }) => {
  const [, { value: usernames, error }, { setValue, setError }] = useField<string[]>('usernames');
  const fieldId = getFieldId('usernames', 'input');
  const [username, setUsername] = React.useState('');
  const [, setValidating] = React.useState(false);

  const debouncedValidate = useDebounceCallback(
    React.useCallback(async () => {
      setValidating(true);
      setError('');

      if (!username) {
        setValidating(false);
        return;
      }
      try {
        // We cannot enjoy the form validation schema directly.
        // When we enjoy the validation schema, invalid usernames
        // would become chips first then errors would be shown.
        await konfluxUsernameYupValidation.validate(username);
        setValidating(false);
      } catch (err) {
        setValidating(false);
        setError(err.message as string);
      }
    }, [setError, username]),
  );

  const handleAddUsername = () => {
    if (username.trim() !== '' && !usernames.includes(username)) {
      void debouncedValidate();
      if (!error) {
        void setValue([...usernames, username]);
        setUsername(''); // only clean username when there is no error.
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // for enter and tab
    if ((event.key === 'Enter' || event.key === 'Tab') && username.trim() !== '') {
      event.preventDefault();
      handleAddUsername();
    }
  };

  // for lose focus
  const handleBlur = () => {
    handleAddUsername();
  };

  return (
    <FormSection title="Add users">
      <Alert variant={AlertVariant.info} title="Username not validated" isInline>
        Konflux is not currently validating usernames, so make sure that usernames you enter are
        accurate.
      </Alert>
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
              void debouncedValidate(); // Trigger validation on input change
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
          >
            <ChipGroup>
              {usernames?.map((name) => (
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
            {error ? (
              <HelperTextItem variant="error" hasIcon>
                {error}
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
