import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { COMPONENT_DETAILS_PATH } from '@routes/paths';
import { TableData } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { UIEnterpriseContractData } from '../types';
import { getRuleStatus } from '../utils';
import { EnterpriseContractTableColumnClasses } from './EnterpriseContractHeader';
import './EnterpriceContractTable.scss';

type EnterpriseContractRowType = {
  data: UIEnterpriseContractData;
};

const EnterpriseContractRow: React.FC<EnterpriseContractRowType> = ({ data }) => {
  const namespace = useNamespace();
  const { applicationName } = useParams();
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
        <Link
          to={COMPONENT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            applicationName: applicationName || '',
            componentName: data.component,
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
