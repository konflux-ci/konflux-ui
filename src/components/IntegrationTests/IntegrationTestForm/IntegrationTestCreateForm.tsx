import * as React from 'react';
import { useParams } from 'react-router-dom';
import { RouterParams } from '../../../routes/utils';
import IntegrationTestView from './IntegrationTestView';

export const IntegrationTestCreateForm: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();

  return <IntegrationTestView applicationName={applicationName} />;
};
