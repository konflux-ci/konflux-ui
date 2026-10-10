import { useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import ComponentRegistryLogin from '~/components/Components/ComponentDetails/tabs/ComponentRegistryLogin';
import ComponentBuildSettings from '~/components/ComponentsPage/ComponentDetails/ComponentBuildSettings';
import ComponentSourceDetails from '~/components/ComponentsPage/ComponentDetails/ComponentSourceDetails';
import ComponentSuccessfulBuild from '~/components/ComponentsPage/ComponentDetails/ComponentSuccessfulBuild';
import { DetailsSection } from '~/components/DetailsPage';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import { useLatestSuccessfulBuildPipelineRunForComponentV2 } from '~/hooks/useLatestPushBuildPipeline';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ComponentKind } from '~/types';
import { getComponentVersion } from '~/utils/version-utils';

const ComponentOverview: React.FC<{ component: ComponentKind }> = ({ component }) => {
  const [pipelineRun, loaded, error] = useLatestSuccessfulBuildPipelineRunForComponentV2(
    component.metadata.namespace,
    component.metadata.name,
  );
  const buildVersion =
    !error && loaded
      ? pipelineRun?.metadata.labels?.[PipelineRunLabel.COMPONENT_VERSION]
      : undefined;
  const version = buildVersion ? getComponentVersion(component, buildVersion) : undefined;
  return (
    <>
      <ComponentSourceDetails component={component} />
      <ComponentSuccessfulBuild
        component={component}
        pipelineRun={pipelineRun}
        loaded={loaded}
        error={error}
      />
      {!loaded && !error ? (
        <DetailsSection title="Build settings">
          <Spinner aria-label="Loading build settings" />
        </DetailsSection>
      ) : (
        <ComponentBuildSettings component={component} version={version} />
      )}
      <DetailsSection title="Registry Login Information">
        <ComponentRegistryLogin />
      </DetailsSection>
    </>
  );
};

const ComponentDetailsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName } = useParams<RouterParams>();
  const [component, loaded, error] = useComponentV2(namespace, componentName, true);
  if (!loaded)
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  if (error || !component) return getErrorState(error ?? { code: 404 }, loaded, 'component');
  return <ComponentOverview key={component.metadata.name} component={component} />;
};

export default ComponentDetailsTab;
