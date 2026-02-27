import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
} from '@patternfly/react-core';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import LatestBuildSection from '~/components/LatestBuild/LatestBuildSection';
import { useComponent } from '~/hooks/useComponents';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { getComponentVersion } from '~/utils/version-utils';
import { DetailsSection } from '../../DetailsPage';

const ComponentVersionDetailsTab: React.FC = () => {
  const namespace = useNamespace();
  const { componentName, versionRevision } = useParams<RouterParams>();
  const [component, loaded, componentError] = useComponent(namespace, componentName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'Component version');
  }

  const version = getComponentVersion(component, versionRevision);

  if (!version) {
    return getErrorState({ code: 404 }, true, `Component version '${versionRevision}'`);
  }

  const repoUrl = component.spec.source?.url;
  const pipelineDef = version['build-pipeline'] ?? component.spec['default-build-pipeline'];
  const pipelineEntry = pipelineDef?.['pull-and-push'] ?? pipelineDef?.push ?? pipelineDef?.pull;
  const pipelineName =
    pipelineEntry?.['pipelineref-by-name'] ?? pipelineEntry?.['pipelinespec-from-bundle']?.name;

  return (
    <>
      <DetailsSection title="Version details">
        <DescriptionList>
          <DescriptionListGroup>
            <DescriptionListTerm>Name</DescriptionListTerm>
            <DescriptionListDescription data-test="version-name">
              {version.name}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Git branch or tag</DescriptionListTerm>
            <DescriptionListDescription data-test="version-branch">
              {repoUrl ? (
                <GitRepoLink url={repoUrl} revision={version.revision} />
              ) : (
                version.revision || '-'
              )}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Pipeline</DescriptionListTerm>
            <DescriptionListDescription data-test="version-pipeline">
              {pipelineName || '-'}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <LatestBuildSection component={component} version={versionRevision} />
          </DescriptionListGroup>
        </DescriptionList>
      </DetailsSection>
    </>
  );
};

export default ComponentVersionDetailsTab;
