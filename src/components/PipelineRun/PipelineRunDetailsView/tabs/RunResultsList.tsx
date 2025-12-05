import * as React from 'react';
import { TektonResultsRun } from '../../../../types';
import NameValueList from './NameValueList';

type Props = {
  results: TektonResultsRun[];
  status: string;
  compressed?: boolean;
};

const RunResultsList: React.FC<React.PropsWithChildren<Props>> = ({
  results,
  status,
  compressed,
}) => (
  <NameValueList
    items={results}
    descriptionListTestId="pipeline-run-details"
    title="Results"
    status={status}
    compressed={compressed}
  />
);

export default RunResultsList;
