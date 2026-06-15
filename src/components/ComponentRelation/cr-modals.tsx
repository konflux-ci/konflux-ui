import * as React from 'react';
import {
  Button,
  Divider,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Form,
  FormHelperText,
  HelperText,
  HelperTextItem,
  Icon,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useFormikContext } from 'formik';
import { isEmpty } from 'lodash-es';
import { LEARN_MORE_ABOUT_NUDGING } from '~/consts/documentation';
import { FormFooter } from '../../shared';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { RawComponentProps } from '../modal/createModalLauncher';
import { ComponentRelation } from './ComponentRelationForm';
import { ComponentRelationFormikValue, ComponentRelationNudgeType } from './type';
import { DUPLICATE_RELATONSHIP } from './utils';

type DefineComponentRelationModalProps = Omit<Pick<RawComponentProps, 'modalProps'>, 'onClose'> & {
  componentNames: string[];
  sortedGroupedComponents: { [application: string]: string[] };
  onCancel: () => void;
};

export const DefineComponentRelationModal: React.FC<DefineComponentRelationModalProps> = ({
  onCancel,
  modalProps,
  componentNames,
  sortedGroupedComponents,
}) => {
  const { values, handleSubmit, isSubmitting, dirty, errors, status } =
    useFormikContext<ComponentRelationFormikValue>();
  const isDuplicateRelationExist = errors?.relations?.includes(DUPLICATE_RELATONSHIP);

  const { isOpen, appendTo, ...rest } = modalProps || {};

  return (
    <Modal
      {...rest}
      isOpen={isOpen}
      onClose={onCancel}
      appendTo={appendTo}
      variant={ModalVariant.medium}
    >
      <ModalHeader
        title="Component relationships"
        description={
          <>
            Nudging references another component by digest.{' '}
            <ExternalLink href={LEARN_MORE_ABOUT_NUDGING}>Learn more about nudging.</ExternalLink>
          </>
        }
      />
      <ModalBody>
        <Form onSubmit={handleSubmit}>
          <FieldArray
            name="relations"
            render={(arrayHelpers) => {
              return (
                <Flex direction={{ default: 'column' }}>
                  {values.relations.map((_, index) => {
                    return (
                      <>
                        <ComponentRelation
                          key={index}
                          componentNames={componentNames}
                          sortedGroupedComponents={sortedGroupedComponents}
                          index={index}
                          removeProps={{
                            disableRemove:
                              values.relations.length === 1 &&
                              values.relations[0].source === '' &&
                              values.relations[0].target.length === 0,
                            onRemove: () =>
                              values.relations.length <= 1
                                ? arrayHelpers.replace(0, {
                                    source: '',
                                    nudgeType: ComponentRelationNudgeType.NUDGES,
                                    target: [],
                                  })
                                : arrayHelpers.remove(index),
                          }}
                        />
                        {index !== values.relations.length - 1 ? <Divider /> : null}
                      </>
                    );
                  })}
                  <FlexItem>
                    {isDuplicateRelationExist && (
                      <FormHelperText>
                        <HelperText>
                          <HelperTextItem variant="error">
                            This relationship is already set up. To edit, go to the respective field
                            in this modal
                          </HelperTextItem>
                        </HelperText>
                      </FormHelperText>
                    )}
                  </FlexItem>
                  <FlexItem>
                    <Button
                      className="pf-m-link--align-left"
                      onClick={() =>
                        arrayHelpers.push({
                          source: '',
                          nudgeType: ComponentRelationNudgeType.NUDGES,
                          target: [],
                        })
                      }
                      type="button"
                      data-test="add-key-value-button"
                      variant="link"
                      icon={<PlusCircleIcon />}
                    >
                      Add another component relationship
                    </Button>
                  </FlexItem>
                </Flex>
              );
            }}
          />
        </Form>
      </ModalBody>
      <ModalFooter>
        <FormFooter
          submitLabel={'Save relationships'}
          handleCancel={onCancel}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableSubmit={!dirty || !isEmpty(errors) || isSubmitting}
          errorMessage={status?.submitError}
        />
      </ModalFooter>
    </Modal>
  );
};

const SuccessIcon: React.FC = () => (
  <Icon status="success">
    <CheckCircleIcon />
  </Icon>
);

type ConfirmSubmissionComponentRelationModalProps = Pick<RawComponentProps, 'modalProps'>;

export const ConfirmSubmissionComponentRelationModal: React.FC<
  ConfirmSubmissionComponentRelationModalProps
> = ({ modalProps }) => {
  const { isOpen, onClose, appendTo, ...rest } = modalProps || {};

  return (
    <Modal {...rest} isOpen={isOpen} appendTo={appendTo} variant={ModalVariant.medium}>
      <ModalBody>
        <EmptyState headingLevel="h2" icon={SuccessIcon} titleText="Relationships updated!">
          <EmptyStateBody>Checkout each component&apos;s details page to view</EmptyStateBody>
          <EmptyStateFooter>
            <EmptyStateActions>
              <Button variant="primary" onClick={onClose}>
                Done
              </Button>
            </EmptyStateActions>
          </EmptyStateFooter>
        </EmptyState>
      </ModalBody>
    </Modal>
  );
};

type ConfirmCancelationComponentRelationModalProps = Pick<RawComponentProps, 'modalProps'> & {
  onGoBack: () => void;
};

export const ConfirmCancelationComponentRelationModal: React.FC<
  ConfirmCancelationComponentRelationModalProps
> = ({ modalProps, onGoBack }) => {
  const { isOpen, onClose, appendTo, ...rest } = modalProps || {};

  return (
    <Modal {...rest} isOpen={isOpen} appendTo={appendTo} variant={ModalVariant.small}>
      <ModalHeader title="Your changes will be lost!" />
      <ModalBody>Are you sure you want to close the window?</ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="primary" onClick={onGoBack}>
          Go back
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Close anyway
        </Button>
      </ModalFooter>
    </Modal>
  );
};
