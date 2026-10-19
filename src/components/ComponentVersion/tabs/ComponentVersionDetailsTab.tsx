import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import ComponentRegistryLogin from '~/components/Components/ComponentDetails/tabs/ComponentRegistryLogin';
import ComponentBuildSettings from '~/components/ComponentsPage/ComponentDetails/ComponentBuildSettings';
import ComponentSourceDetails from '~/components/ComponentsPage/ComponentDetails/ComponentSourceDetails';
import ComponentSuccessfulBuild from '~/components/ComponentsPage/ComponentDetails/ComponentSuccessfulBuild';
import { DetailsSection } from '~/components/DetailsPage';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { useLatestSuccessfulBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind, ComponentVersion } from '~/types';
import { getComponentVersion } from '~/utils/version-utils';

const VersionOverview: React.FC<{ component: ComponentKind; version: ComponentVersion }> = ({
  component,
  version,
}) => {
  const [pipelineRun, loaded, error] = useLatestSuccessfulBuildPipelineRunForComponentV2(
    component.metadata.namespace,
    component.metadata.name,
    version.name,
  );
  return (
    <>
      <ComponentSourceDetails component={component} version={version} />
      <ComponentSuccessfulBuild
        component={component}
        pipelineRun={pipelineRun}
        loaded={loaded}
        error={error}
      />
      <ComponentBuildSettings component={component} version={version} />
      <DetailsSection title="Registry Login Information">
        <ComponentRegistryLogin />
      </DetailsSection>
    </>
  );
};

const ComponentVersionDetailsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName, versionRevision } = useParams<RouterParams>();
  const [component, loaded, error] = useComponentV2(namespace, componentName);
  if (!loaded)
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  if (error || !component)
    return getErrorState(error ?? { code: 404 }, loaded, 'Component version');
  const version = getComponentVersion(component, versionRevision);
  if (!version) return getErrorState({ code: 404 }, true, `Component version '${versionRevision}'`);
  return (
    <VersionOverview
      key={`${component.metadata.name}/${version.name}`}
      component={component}
      version={version}
    />
  );
};

export default ComponentVersionDetailsTab;
