import * as React from 'react';
import {
  Button,
  ButtonType,
  ButtonVariant,
  Form,
  InputGroup,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useField, useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { isEmpty } from 'lodash-es';
import { CVE } from '../../../../../types/coreBuildService';
import { CVEComponentDropDown } from './CVEComponentDropDown';

type CVEFormValues = CVE;

type CVEFormContentProps = {
  modalToggle: () => void;
};
const CVEFormContent: React.FC<CVEFormContentProps> = ({ modalToggle }) => {
  const { handleSubmit, isSubmitting, errors, dirty } = useFormikContext<CVEFormValues>();
  const [{ value: packages }, ,] = useField<string[]>('packages');

  return (
    <Form>
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <Text component={TextVariants.p}>
              Provide information about a Common Vulnerabilities and Exposures (CVE) entry that has
              already been addressed.
            </Text>
          </TextContent>
        </StackItem>
        <StackItem>
          <InputField data-test="cve-issue-id" label="CVE key" name="key" required />
        </StackItem>
        <StackItem>
          <InputGroup className="pf-v5-u-mb-sm" data-test="component-field">
            <CVEComponentDropDown name="component" />
          </InputGroup>
        </StackItem>
        <StackItem>
          <FieldArray
            name="packages"
            render={(packageArrayHelper) => {
              return (
                <>
                  {Array.isArray(packages) &&
                    packages.length > 0 &&
                    packages.map((__, j) => (
                      <StackItem key={`package-${j}`}>
                        <InputGroup className="pf-v5-u-mb-sm pf-v5-u-ml-md">
                          <InputField
                            label="Package"
                            data-test={`pac-${j}`}
                            name={`packages[${j}]`}
                          />
                          <Button
                            variant={ButtonVariant.plain}
                            onClick={() => packageArrayHelper.remove(j)}
                            data-test={`pac-${j}`}
                          >
                            <MinusCircleIcon />
                          </Button>
                        </InputGroup>
                      </StackItem>
                    ))}
                  <Button
                    onClick={() => {
                      packageArrayHelper.push('');
                    }}
                    variant={ButtonVariant.link}
                    icon={<PlusCircleIcon />}
                    data-test={`pac`}
                  >
                    {packages?.length > 0 ? ' Add another package' : 'Add package'}
                  </Button>
                </>
              );
            }}
          />
        </StackItem>
        <StackItem>
          <Button
            isDisabled={!dirty || !isEmpty(errors) || isSubmitting}
            type={ButtonType.submit}
            isLoading={isSubmitting}
            data-test="add-cve-btn"
            onClick={(e) => {
              e.preventDefault(), handleSubmit();
              modalToggle();
            }}
          >
            Add CVE
          </Button>
          <Button
            data-test="close-cve-modal"
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

export default CVEFormContent;
