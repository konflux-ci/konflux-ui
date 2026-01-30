import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { TableData } from '~/shared';
import useComponentDetailsPath from '../../../routes/hooks/useComponentDetailsPath';
import { UIEnterpriseContractData } from '../types';
import { getRuleStatus } from '../utils';
import { EnterpriseContractTableColumnClasses } from './EnterpriseContractHeader';
import './EnterpriceContractTable.scss';

type EnterpriseContractRowType = {
  data: UIEnterpriseContractData;
};

const EnterpriseContractRow: React.FC<EnterpriseContractRowType> = ({ data }) => {
  const { applicationName } = useParams();

  const { getComponentDetailsPath } = useComponentDetailsPath();

  return (
    <>
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
        <Link to={getComponentDetailsPath(applicationName || '', data.component)}>
          {data.component}
        </Link>
      </TableData>
    </>
  );
};

interface WrappedEnterpriseContractRowProps {
  obj: UIEnterpriseContractData;
  customData: { sortedECResult: UIEnterpriseContractData[] };
}

export const WrappedEnterpriseContractRow: React.FC<WrappedEnterpriseContractRowProps> = ({
  obj,
  customData,
}) => {
  const customECResult = customData?.sortedECResult;

  if (Array.isArray(customECResult) && customECResult.length > 0) {
    const index = customECResult.findIndex((item) => item === obj);

    return <EnterpriseContractRow data={obj} key={index} />;
  }

  return null;
};
