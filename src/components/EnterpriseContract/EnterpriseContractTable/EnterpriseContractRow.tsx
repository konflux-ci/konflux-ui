import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Truncate,
} from '@patternfly/react-core';
import { ExpandableRowContent } from '@patternfly/react-table';
import { COMPONENT_LIST_PATH } from '@routes/paths';
import { TableData } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import ExternalLink from '../../../shared/components/links/ExternalLink';
import { Timestamp } from '../../../shared/components/timestamp/Timestamp';
import { UIEnterpriseContractData } from '../types';
import { getRuleStatus } from '../utils';
import { EnterpriseContractTableColumnClasses } from './EnterpriseContractHeader';

type EnterpriseContractRowType = {
  data: UIEnterpriseContractData;
  rowIndex: number;
  rowExpanded: boolean;
  onToggle?: (index: number) => void;
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
    <>
      {/* Main row */}
      <TableData
        data-test="ec-expand-row"
        className={`${EnterpriseContractTableColumnClasses.expand}`}
      >
        <button className="pf-v5-c-button pf-m-plain" onClick={() => onToggle?.(rowIndex)}>
          {rowExpanded ? '▼' : '▶'}
        </button>
      </TableData>

      <TableData className={`${EnterpriseContractTableColumnClasses.rules}`}>
        {data.title ?? '-'}
        {/* Expanded Row */}
        {rowExpanded && (
          <div className="rule-description" data-test="ec-expand-row">
            <ExpandableRowContent>
              <DescriptionList isAutoColumnWidths columnModifier={{ default: '3Col' }}>
                <DescriptionListGroup>
                  <DescriptionListTerm>Rule Description</DescriptionListTerm>
                  <DescriptionListDescription>{data.description ?? '-'}</DescriptionListDescription>
                </DescriptionListGroup>

                {data.collection?.length ? (
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
          </div>
        )}
      </TableData>
      <TableData
        date-test="rule-status"
        className={`${EnterpriseContractTableColumnClasses.status}`}
      >
        {getRuleStatus(data.status)}
      </TableData>
      <TableData className={`${EnterpriseContractTableColumnClasses.message}`}>
        {data.msg ? <Truncate content={data.msg} /> : '-'}
      </TableData>
      <TableData className={`${EnterpriseContractTableColumnClasses.component}`}>
        <Link
          to={COMPONENT_LIST_PATH.createPath({
            workspaceName: namespace,
            applicationName: appName,
          })}
        >
          {data.component}
        </Link>
      </TableData>
    </>
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
  const customECResult = customData?.sortedECResult;

  if (Array.isArray(customECResult) && customECResult.length > 0) {
    const index = customECResult?.findIndex((item) => item === obj);
    const isRowExpanded = expandedRowIndex === index;

    return (
      <EnterpriseContractRow
        data={obj}
        key={index}
        rowIndex={index}
        rowExpanded={isRowExpanded}
        // eslint-disable-next-line @typescript-eslint/no-shadow
        onToggle={(index) => setExpandedRowIndex(isRowExpanded ? null : index)}
      />
    );
  }

  return null;
};
