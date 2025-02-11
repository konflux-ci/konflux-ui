import * as React from 'react';
import {
  Button,
  ButtonType,
  ButtonVariant,
  Form,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { isEmpty } from 'lodash-es';
import StatusDropdown from './StatusDropdown';
import UploadDate from './UploadDate';

type BugFormValues = {
  id: string;
  source: string;
  uploadDate: string;
  status: string;
};

type BugFormContentProps = {
  modalToggle: () => void;
};
const BugFormContent: React.FC<BugFormContentProps> = ({ modalToggle }) => {
  const { handleSubmit, isSubmitting, errors, dirty } = useFormikContext<BugFormValues>();

  return (
    <Form>
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text component={TextVariants.p}>
              Provide information about a Bug that has already been resolved.
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <InputField data-test="bug-issue-id" label="Bug issue id" name="id" isRequired />
        </StackItem>
        <StackItem>
          <InputField data-test="bug-source" label="Source" name="source" isRequired />
        </StackItem>
        <StackItem>
          <UploadDate name="uploadDate" label="Last updated" />
        </StackItem>
        <StackItem>
          <StatusDropdown name="status" />
        </StackItem>
        <StackItem>
          <Button
            isDisabled={!dirty || !isEmpty(errors) || isSubmitting}
            type={ButtonType.submit}
            isLoading={isSubmitting}
            data-test="add-bug-btn"
            onClick={(e) => {
              e.preventDefault();
              handleSubmit();
              modalToggle();
            }}
          >
            Add Bug
          </Button>
          <Button
            data-test="close-bug-modal"
            variant={ButtonVariant.link}
            className="pf-v5-u-ml-sm"
            onClick={(e) => {
              e.preventDefault(), modalToggle();
            }}
          >
            Close
          </Button>
        </StackItem>
      </Stack>
    </Form>
  );
};

export default BugFormContent;
