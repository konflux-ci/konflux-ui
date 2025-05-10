import React from 'react';
import { Alert, Spinner } from '@patternfly/react-core';
import { useBanner } from './hooks/useBanner';

export const KonfluxBanner: React.FC = () => {
  const { data: banner, isLoading, error } = useBanner();

  if (isLoading) return <Spinner size="md" />;
  if (error || !banner) return null;

  return <Alert variant={banner.type || 'info'} title={banner.message} isInline />;
};
