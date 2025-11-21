import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { useRelease } from '../../hooks/useReleases';
import { RouterParams } from '../../routes/utils';
import { YAMLViewer } from '../../shared/components/code-viewer/YAMLViewer';
import { useNamespace } from '../../shared/providers/Namespace';
import { getErrorState } from '../../shared/utils/error-utils';

export const ReleaseYamlTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, loaded, error] = useRelease(namespace, releaseName);

  if (!loaded) {
    return (
      <Bullseye data-test="release-yaml-loading">
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'release');
  }

  return <YAMLViewer code={release} />;
};

export default ReleaseYamlTab;
