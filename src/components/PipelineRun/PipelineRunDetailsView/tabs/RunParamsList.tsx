import * as React from 'react';
import { PipelineRunParam, PipelineTaskParam } from '../../../../types';
import NameValueList from './NameValueList';

type Props = {
  params: (PipelineRunParam | PipelineTaskParam)[];
  compressed?: boolean;
};

const normalizeValueToString = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }

  if (Array.isArray(value)) {
    return value.map(String).join(', ');
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

const RunParamsList: React.FC<React.PropsWithChildren<Props>> = ({ params, compressed }) => {
  const items = React.useMemo(
    () => params.map((p) => ({ name: p.name, value: normalizeValueToString(p.value) })),
    [params],
  );
  return (
    <NameValueList
      items={items}
      descriptionListTestId="run-params-list"
      title="Parameters"
      status={null}
      compressed={compressed}
    />
  );
};

export default RunParamsList;
