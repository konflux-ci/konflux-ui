import React from 'react';
import { Stack, StackItem, Content, ModalVariant } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { createModalLauncher, RawComponentProps } from '~/components/modal/createModalLauncher';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { TaskRunSBOM } from '../utils/pipelinerun-utils';

type PipelineRunSBOMsProps = {
  sboms: TaskRunSBOM[];
};

type PipelineRunSBOMsModalProps = RawComponentProps & PipelineRunSBOMsProps;

const PipelineRunSBOMsModal: React.FC<PipelineRunSBOMsModalProps> = ({ sboms }) => {
  return (
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
  );
};

export const createPipelineRunSBOMsModal = (props: PipelineRunSBOMsProps) =>
  createModalLauncher(PipelineRunSBOMsModal, {
    'data-test': `pipelinerun-sboms-modal`,
    variant: ModalVariant.small,
    title: 'SBOMs',
  })(props);
