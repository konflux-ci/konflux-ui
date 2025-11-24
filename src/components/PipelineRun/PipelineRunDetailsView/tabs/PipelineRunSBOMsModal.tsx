import React from 'react';
import { Modal, ModalVariant, Stack, StackItem, Text } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { createRawModalLauncher, RawComponentProps } from '~/components/modal/createModalLauncher';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { TaskRunSBOM } from '../utils/pipelinerun-utils';

type PipelineRunSBOMsProps = {
  sboms: TaskRunSBOM[];
};

type PipelineRunSBOMsModalProps = RawComponentProps & PipelineRunSBOMsProps;

const PipelineRunSBOMsModal: React.FC<PipelineRunSBOMsModalProps> = ({ modalProps, sboms }) => {
  return (
    <Modal {...modalProps} title="SBOMs" variant={ModalVariant.small}>
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
                      <Text style={{ fontWeight: 'bold' }}>Index</Text>
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
    </Modal>
  );
};

export const createPipelineRunSBOMsModal = (props: PipelineRunSBOMsProps) =>
  createRawModalLauncher<PipelineRunSBOMsProps, Record<string, unknown>>(PipelineRunSBOMsModal, {
    'data-test': 'pipelinerun-sboms-modal',
  })(props);
