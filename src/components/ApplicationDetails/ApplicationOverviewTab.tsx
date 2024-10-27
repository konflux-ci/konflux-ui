import * as React from 'react';
import { useParams } from 'react-router-dom';
import { RouterParams } from '../../routes/utils';
import { useWhatsNextItems } from '../WhatsNext/useWhatsNextItems';
import WhatsNextSection from '../WhatsNext/WhatsNextSection';
import AppWorkflowSection from './tabs/overview/sections/AppWorkflowSection';

const ApplicationOverviewTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  const whatsNextItems = useWhatsNextItems(applicationName);
  return (
    <>
      <AppWorkflowSection applicationName={applicationName} />
      <WhatsNextSection whatsNextItems={whatsNextItems} />
    </>
  );
};

export default ApplicationOverviewTab;
