import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons/dist/esm/icons/angle-down-icon';
import { AngleRightIcon } from '@patternfly/react-icons/dist/esm/icons/angle-right-icon';
import { COMPONENT_LIST_PATH } from '@routes/paths';
import { TableData } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { UIEnterpriseContractData } from '../types';
import { getRuleStatus } from '../utils';
import { EnterpriseContractTableColumnClasses } from './EnterpriseContractHeader';

import './EnterpriceContractTable.scss';

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
        className={`${EnterpriseContractTableColumnClasses.expand} vertical-center-cell`}
      >
        <button
          className="pf-v5-c-button pf-m-plain"
          onClick={() => onToggle?.(rowIndex)}
          style={{ display: 'flex' }}
        >
          {rowExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
        </button>
      </TableData>

      <TableData className={`${EnterpriseContractTableColumnClasses.rules} vertical-center-cell`}>
        {data.title ?? '-'}
      </TableData>
      <TableData
        data-test="rule-status"
        className={`${EnterpriseContractTableColumnClasses.status} vertical-center-cell`}
      >
        {getRuleStatus(data.status)}
      </TableData>
      <TableData className={`${EnterpriseContractTableColumnClasses.message} vertical-center-cell`}>
        {data.msg ? <Truncate content={data.msg} /> : '-'}
      </TableData>
      <TableData
        className={`${EnterpriseContractTableColumnClasses.component} vertical-center-cell`}
      >
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
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const WrappedEnterpriseContractRow: React.FC<WrappedEnterpriseContractRowProps> = ({
  obj,
  customData,
  isExpanded,
  onToggleExpand,
}) => {
  const customECResult = customData?.sortedECResult;

  if (Array.isArray(customECResult) && customECResult.length > 0) {
    const index = customECResult.findIndex((item) => item === obj);

    return (
      <EnterpriseContractRow
        data={obj}
        key={index}
        rowIndex={index}
        rowExpanded={isExpanded}
        onToggle={() => onToggleExpand()}
      />
    );
  }

  return null;
};
