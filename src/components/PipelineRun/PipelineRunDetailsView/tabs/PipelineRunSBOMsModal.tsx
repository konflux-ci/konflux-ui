import React from 'react';
import {
  Stack,
  StackItem,
  Content,
  Modal,
  ModalBody,
  ModalHeader,
  ModalVariant,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { createRawModalLauncher, RawComponentProps } from '~/components/modal/createModalLauncher';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { TaskRunSBOM } from '../utils/pipelinerun-utils';

type PipelineRunSBOMsProps = {
  sboms: TaskRunSBOM[];
};

type PipelineRunSBOMsModalProps = RawComponentProps & PipelineRunSBOMsProps;

const PipelineRunSBOMsModal: React.FC<PipelineRunSBOMsModalProps> = ({ modalProps, sboms }) => {
  const { isOpen, onClose, appendTo } = modalProps || {};

  return (
    <Modal isOpen={isOpen} onClose={onClose} appendTo={appendTo} variant={ModalVariant.small}>
      <ModalHeader title="SBOMs" />
      <ModalBody>
        <Stack hasGutter>
          <StackItem>
            <Table variant="compact" borders>
              <Thead>
                <Tr>
                  <Th>Note</Th>
                  <Th>Link</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sboms.map((sbom, i) => (
                  <Tr key={`${sbom.url}-${i}`}>
                    <Td>
                      {sbom.isIndex ? (
                        <Content component="p" style={{ fontWeight: 'bold' }}>
                          Index
                        </Content>
                      ) : (
                        sbom.platform || '-'
                      )}
                    </Td>
                    <Td>
                      <ExternalLink href={sbom.url}>View SBOM</ExternalLink>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </StackItem>
        </Stack>
      </ModalBody>
    </Modal>
  );
};

export const createPipelineRunSBOMsModal = (props: PipelineRunSBOMsProps) =>
  createRawModalLauncher<PipelineRunSBOMsProps, Record<string, unknown>>(PipelineRunSBOMsModal, {
    'data-test': 'pipelinerun-sboms-modal',
  })(props);
