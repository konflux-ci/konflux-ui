import * as React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Truncate } from '@patternfly/react-core';
import { COMPONENT_DETAILS_PATH } from '@routes/paths';
import { TableData } from '~/shared';
import { useNamespace } from '~/shared/providers/Namespace';
import { ConformaResultRow } from '~/types/conforma';
import { getRuleStatus } from '../utils';
import { conformaTableColumnClasses } from './ConformaHeader';
import './ConformaTable.scss';

type ConformaRowType = {
  data: ConformaResultRow;
};

const ConformaRow: React.FC<ConformaRowType> = ({ data }) => {
  const namespace = useNamespace();
  const { applicationName } = useParams();
  return (
    <>
      <TableData className={`${conformaTableColumnClasses.rules} vertical-center-cell`}>
        {data.title ?? '-'}
      </TableData>
      <TableData
        data-test="rule-status"
        className={`${conformaTableColumnClasses.status} vertical-center-cell`}
      >
        {getRuleStatus(data.status)}
      </TableData>
      <TableData className={`${conformaTableColumnClasses.message} vertical-center-cell`}>
        {data.msg ? <Truncate content={data.msg} /> : '-'}
      </TableData>
      <TableData className={`${conformaTableColumnClasses.component} vertical-center-cell`}>
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
  obj: ConformaResultRow;
  customData: { sortedConformaResult: ConformaResultRow[] };
}

export const WrappedConformaRow: React.FC<WrappedConformaRowProps> = ({ obj, customData }) => {
  const customConformaResult = customData?.sortedConformaResult;

  if (Array.isArray(customConformaResult) && customConformaResult.length > 0) {
    const index = customConformaResult.findIndex((item) => item === obj);

    return <ConformaRow data={obj} key={index} />;
  }

  return null;
};
