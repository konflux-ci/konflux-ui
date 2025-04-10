import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Truncate,
} from '@patternfly/react-core';
import { ExpandableRowContent, Tbody, Td, Tr } from '@patternfly/react-table';
import { COMPONENT_LIST_PATH } from '@routes/paths';
import { useNamespace } from '~/shared/providers/Namespace';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { UIEnterpriseContractData } from '../types';
import { getRuleStatus } from '../utils';

type EnterpriseContractRowType = {
  data: UIEnterpriseContractData;
  rowIndex: number;
  rowExpanded: boolean;
  onToggle: () => void;
};

const EnterpriseContractRow: React.FC<EnterpriseContractRowType> = ({
  data,
  rowIndex,
  rowExpanded,
  onToggle,
}) => {
  const namespace = useNamespace();
  const { appName } = useParams();

  return (
    <Tbody isExpanded={rowExpanded}>
      <Tr>
        <Td
          data-test="ec-expand-row"
          expand={{
            rowIndex,
            isExpanded: rowExpanded,
            onToggle,
          }}
        />
        <Td>{data.title ?? '-'}</Td>
        <Td data-test="rule-status">{getRuleStatus(data.status)}</Td>
        <Td>{data.msg ? <Truncate content={data.msg} /> : '-'}</Td>
        <Td>
          <Link
            to={COMPONENT_LIST_PATH.createPath({
              workspaceName: namespace,
              applicationName: appName,
            })}
          >
            {data.component}
          </Link>
        </Td>
      </Tr>
      <Tr isExpanded={rowExpanded}>
        <Td />
        <Td colSpan={4}>
          <ExpandableRowContent>
            <DescriptionList
              isAutoColumnWidths
              columnModifier={{
                default: '3Col',
              }}
            >
              <DescriptionListGroup>
                <DescriptionListTerm>Rule Description</DescriptionListTerm>
                <DescriptionListDescription>{data.description ?? '-'}</DescriptionListDescription>
              </DescriptionListGroup>
              {data.collection && data.collection.length ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>Collection</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ExternalLink href="https://enterprisecontract.dev/docs/ec-policies/release_policy.html#_available_rule_collections">
                      {data.collection.join(', ')}
                    </ExternalLink>
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}
              {data.solution ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>Solution</DescriptionListTerm>
                  <DescriptionListDescription>{data.solution}</DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}
              {data.timestamp ? (
                <DescriptionListGroup>
                  <DescriptionListTerm>Effective from</DescriptionListTerm>
                  <DescriptionListDescription>
                    <Timestamp timestamp={data.timestamp} />
                  </DescriptionListDescription>
                </DescriptionListGroup>
              ) : null}
            </DescriptionList>
          </ExpandableRowContent>
        </Td>
      </Tr>
    </Tbody>
  );
};

interface WrappedEnterpriseContractRowProps {
  obj: UIEnterpriseContractData;
  customData: { sortedECResult: UIEnterpriseContractData[] };
  expandedRowIndex: number | null;
  setExpandedRowIndex: (index: number | null) => void;
}

export const WrappedEnterpriseContractRow: React.FC<WrappedEnterpriseContractRowProps> = ({
  obj,
  customData,
  expandedRowIndex,
  setExpandedRowIndex,
}) => {
  const customSortedECResult = customData?.sortedECResult;

  if (Array.isArray(customSortedECResult) && customSortedECResult.length > 0) {
    const index = customSortedECResult?.findIndex((item) => item === obj);
    const isRowExpanded = expandedRowIndex === index;

    return (
      <EnterpriseContractRow
        data={obj}
        key={index}
        rowIndex={index}
        rowExpanded={isRowExpanded}
        onToggle={() => setExpandedRowIndex(isRowExpanded ? null : index)}
      />
    );
  }

  return null;
};
