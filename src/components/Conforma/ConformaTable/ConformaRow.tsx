import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { COMPONENT_DETAILS_PATH } from '@routes/paths';
import { TableData } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { UIConformaData } from '~/types/conforma';
import { getRuleStatus } from '../utils';
import { ConformaTableColumnClasses } from './ConformaHeader';
import './ConformaTable.scss';

type ConformaRowType = {
  data: UIConformaData;
};

const ConformaRow: React.FC<ConformaRowType> = ({ data }) => {
  const namespace = useNamespace();
  const { applicationName } = useParams();
  return (
    <>
      <TableData className={`${ConformaTableColumnClasses.rules} vertical-center-cell`}>
        {data.title ?? '-'}
      </TableData>
      <TableData
        data-test="rule-status"
        className={`${ConformaTableColumnClasses.status} vertical-center-cell`}
      >
        {getRuleStatus(data.status)}
      </TableData>
      <TableData className={`${ConformaTableColumnClasses.message} vertical-center-cell`}>
        {data.msg ? <Truncate content={data.msg} /> : '-'}
      </TableData>
      <TableData className={`${ConformaTableColumnClasses.component} vertical-center-cell`}>
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

interface WrappedConformaRowProps {
  obj: UIConformaData;
  customData: { sortedConformaResult: UIConformaData[] };
}

export const WrappedConformaRow: React.FC<WrappedConformaRowProps> = ({ obj, customData }) => {
  const customConformaResult = customData?.sortedConformaResult;

  if (Array.isArray(customConformaResult) && customConformaResult.length > 0) {
    const index = customConformaResult.findIndex((item) => item === obj);

    return <ConformaRow data={obj} key={index} />;
  }

  return null;
};
