import * as React from 'react';
import { TektonResultsRun } from '../../../../types';
import NameValueList from './NameValueList';
import { normalizeValueToString } from './utils';

type Props = {
  results: TektonResultsRun[];
  status: string;
  compressed?: boolean;
};

const RunResultsList: React.FC<React.PropsWithChildren<Props>> = ({
  results,
  status,
  compressed,
}) => {
  const mappedResults = React.useMemo(
    () => results.map((r) => ({ ...r, value: normalizeValueToString(r.value) })),
    [results],
  );
  return (
    <NameValueList
      items={mappedResults}
      descriptionListTestId="pipeline-run-details"
      title="Results"
      status={status}
      compressed={compressed}
    />
  );
};

export default RunResultsList;
