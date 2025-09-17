import * as React from 'react';
import { useParams } from 'react-router-dom';
import { RouterParams } from '../../routes/utils';
import { useWhatsNextItems } from '../WhatsNext/useWhatsNextItems';
import WhatsNextSection from '../WhatsNext/WhatsNextSection';

const ApplicationOverviewTab: React.FC = () => {
  const { applicationName } = useParams<RouterParams>();
  const whatsNextItems = useWhatsNextItems(applicationName);
  return (
    <>
      <WhatsNextSection whatsNextItems={whatsNextItems} />
    </>
  );
};

export default ApplicationOverviewTab;
