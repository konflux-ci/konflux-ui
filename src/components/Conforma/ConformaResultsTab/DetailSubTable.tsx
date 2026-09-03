import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Content, Tooltip, Truncate as PfTruncate } from '@patternfly/react-core';
import { Table, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { PIPELINE_RUNS_SECURITY_PATH } from '@routes/paths';
import { getRuleStatus } from '~/components/Conforma/utils';
import { Truncate } from '~/shared/components/truncate-text/Truncate';
import { useNamespace } from '~/shared/providers/Namespace';
import type { ConformaResultRow } from '~/types/conforma';
import { getCommonImageName } from './conforma-grouping-utils';

type DetailSubTableProps = {
  rows: ConformaResultRow[];
};

export const DetailSubTable: React.FC<DetailSubTableProps> = ({ rows }) => {
  const namespace = useNamespace();
  const { applicationName } = useParams();

  return (
    <div className="conforma-results-tab__detail-table">
      <Table aria-label="Conforma detail rows" data-test="conforma-detail-table" variant="compact">
        <Thead>
          <Tr>
            <Th>Rule</Th>
            <Th>Component</Th>
            <Th>Image</Th>
            <Th>Status</Th>
            <Th>Message</Th>
            <Th>Pipeline run</Th>
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => {
            const { images } = row;
            const commonName = images.length > 1 ? getCommonImageName(images) : undefined;
            const rowKey = `${row.component}-${row.title}-${row.pipelineRunName || ''}-${row.images[0] || ''}`;

            return (
              <Tr key={rowKey}>
                <Td dataLabel="Rule">
                  <Content>
                    <Content component="p">
                      <strong>{row.title ?? '-'}</strong>
                    </Content>
                    {row.code && <Content component="small">{row.code}</Content>}
                    {row.description && <Content component="small">{row.description}</Content>}
                  </Content>
                </Td>
                <Td dataLabel="Component">{row.component}</Td>
                <Td dataLabel="Image">
                  {images.length > 1 ? (
                    <Tooltip
                      content={
                        <ul>
                          {images.map((img) => (
                            <li key={img}>{img}</li>
                          ))}
                        </ul>
                      }
                    >
                      <Content>
                        {commonName ? (
                          <>
                            <Content component="p">
                              <PfTruncate content={commonName} />
                            </Content>
                            <Content component="small">{images.length} arch variants</Content>
                          </>
                        ) : (
                          <Content component="p">Affects {images.length} images</Content>
                        )}
                      </Content>
                    </Tooltip>
                  ) : images.length === 1 ? (
                    <PfTruncate content={images[0]} />
                  ) : (
                    '-'
                  )}
                </Td>
                <Td dataLabel="Status">{getRuleStatus(row.status)}</Td>
                <Td dataLabel="Message">
                  <Content>
                    <Content component="p">
                      {row.msg != null ? (
                        <Truncate
                          content={row.msg}
                          expandInline
                          data-test="conforma-violation-msg"
                        />
                      ) : (
                        '-'
                      )}
                    </Content>
                    {row.solution && <Content component="small">Solution: {row.solution}</Content>}
                  </Content>
                </Td>
                <Td dataLabel="Pipeline run">
                  {row.pipelineRunName ? (
                    <Link
                      to={PIPELINE_RUNS_SECURITY_PATH.createPath({
                        workspaceName: namespace,
                        applicationName: applicationName || '',
                        pipelineRunName: row.pipelineRunName,
                      })}
                      data-test="conforma-pipeline-run-link"
                    >
                      <PfTruncate content={row.pipelineRunName} />
                    </Link>
                  ) : (
                    '-'
                  )}
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </div>
  );
};
