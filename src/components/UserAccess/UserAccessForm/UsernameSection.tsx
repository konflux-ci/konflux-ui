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
  const [validating, setValidating] = React.useState(false);

  const debouncedValidate = useDebounceCallback(
    React.useCallback(async () => {
      setValidating(true);
      setError('');

      if (!username) {
        setValidating(false);
        return;
      }

      try {
        await konfluxUsernameYupValidation.validate(username);
        setValidating(false);
        setError('');

        if (!usernames.includes(username)) {
          void setValue([...usernames, username]);
        }

        setUsername('');
      } catch (err) {
        setValidating(false);
        setError(err.message as string);
      }
    }, [setError, setValue, username, usernames]),
  );

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
              void debouncedValidate();
            }}
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
            {validating ? (
              <HelperTextItem variant="warning" hasIcon>
                Validating...
              </HelperTextItem>
            ) : error ? (
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
