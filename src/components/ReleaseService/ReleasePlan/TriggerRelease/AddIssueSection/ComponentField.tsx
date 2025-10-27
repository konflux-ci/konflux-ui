import * as React from 'react';
import {
  Button,
  ButtonVariant,
  FormGroup,
  InputGroup,
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useField } from 'formik';
import { InputField } from 'formik-pf';
import { CVEComponentDropDown } from './CVEComponentDropDown';

type ComponentFieldProps = {
  name: string;
};

type CVEComponent = {
  name: string;
  packages: string[];
};

const ComponentField: React.FC<React.PropsWithChildren<ComponentFieldProps>> = ({ name }) => {
  const [{ value: components }, ,] = useField<CVEComponent[]>(name);

  return (
    <FieldArray
      name={name}
      render={({ push, remove }) => {
        return (
          <FormGroup label="Components and packages" data-test="component-field">
            <TextContent>
              <Text component={TextVariants.p}>Which component affects this CVE?</Text>
            </TextContent>
            <Stack>
              {Array.isArray(components) &&
                components.length > 0 &&
                components.map((_, i) => {
                  return (
                    <StackItem key={`${name}[${i}]`}>
                      <InputGroup
                        className="pf-v5-u-mb-sm"
                        label="Which components affect this CVE?"
                        data-test={`component-${i}`}
                      >
                        <CVEComponentDropDown name={`${name}[${i}].name`} />

                        <Button
                          variant={ButtonVariant.plain}
                          onClick={() => remove(i)}
                          data-test={`remove-component-${i}`}
                          isDisabled={components.length === 1}
                        >
                          <MinusCircleIcon />
                        </Button>
                      </InputGroup>

                      <FieldArray
                        name={`${name}[${i}].packages`}
                        render={(packageArrayHelper) => {
                          const packages = components[i].packages;
                          return (
                            <>
                              {Array.isArray(packages) &&
                                packages.length > 0 &&
                                packages.map((__, j) => (
                                  <StackItem key={`component-${i}-package-${j}`}>
                                    <InputGroup
                                      className="pf-v5-u-mb-sm pf-v5-u-ml-md"
                                      label="Package"
                                    >
                                      <InputField
                                        data-test={`cmp-${i}-pac-${j}`}
                                        name={`${name}[${i}].packages[${j}]`}
                                      />
                                      <Button
                                        variant={ButtonVariant.plain}
                                        onClick={() => packageArrayHelper.remove(j)}
                                        data-test={`remove-cmp-${i}-pac-${j}`}
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
                                data-test={`add-cmp-${i}-pac`}
                              >
                                {packages?.length > 0 ? ' Add another package' : 'Add package'}
                              </Button>
                            </>
                          );
                        }}
                      />
                    </StackItem>
                  );
                })}
              <StackItem>
                <Button
                  onClick={() => {
                    push({ name: '', packages: [] });
                  }}
                  variant={ButtonVariant.link}
                  icon={<PlusCircleIcon />}
                  data-test="add-component-button"
                >
                  {components?.length > 0 ? ' Add another component' : 'Add component'}
                </Button>
              </StackItem>
            </Stack>
          </FormGroup>
        );
      }}
    />
  );
};

export default ComponentField;
