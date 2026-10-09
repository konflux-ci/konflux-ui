import { Link } from 'react-router-dom';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';
import { COMPONENT_VERSIONS_PATH } from '@routes/paths';
import { DetailsSection } from '~/components/DetailsPage';
import ExternalLink from '~/shared/components/links/ExternalLink';
import {
  ComponentBuildPipeline,
  ComponentKind,
  ComponentVersion,
  PipelineDefinition,
} from '~/types';

const pipelineLabels: Record<keyof ComponentBuildPipeline, string> = {
  'pull-and-push': 'Pull and push pipeline',
  pull: 'Pull pipeline',
  push: 'Push pipeline',
};

const PipelineConfiguration: React.FC<{ definition: PipelineDefinition }> = ({ definition }) => {
  const name = definition['pipelineref-by-name'];
  const bundle = definition['pipelinespec-from-bundle'];
  const git = definition['pipelineref-by-git-resolver'];
  return (
    <>
      {name && <div>{name}</div>}
      {bundle && (
        <>
          <div>{bundle.name}</div>
          <div>{bundle.bundle}</div>
        </>
      )}
      {git && (
        <>
          <ExternalLink href={git.url} text={git.url} />
          <div>{git.revision}</div>
          <div>{git.pathInRepo}</div>
        </>
      )}
    </>
  );
};

const ComponentBuildSettings: React.FC<{
  component: ComponentKind;
  version?: ComponentVersion;
}> = ({ component, version }) => {
  const pipeline = version?.['build-pipeline'] ?? component.spec['default-build-pipeline'];
  const definitions = Object.entries(pipelineLabels).filter(([key]) => pipeline?.[key]);
  return (
    <DetailsSection
      title="Build settings"
      description="Current configuration used to propose pipeline configuration PRs."
    >
      <p className="pf-v6-u-mb-md">
        {version ? `Current configuration for version ${version.name}` : 'Component defaults'}
      </p>
      {!version && (
        <Link
          to={COMPONENT_VERSIONS_PATH.createPath({
            workspaceName: component.metadata.namespace,
            componentName: component.metadata.name,
          })}
        >
          View version overrides
        </Link>
      )}
      <DescriptionList>
        {version && (
          <DescriptionListGroup>
            <DescriptionListTerm>Builds</DescriptionListTerm>
            <DescriptionListDescription>
              {version['skip-builds'] ? 'Disabled' : 'Enabled'}
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
        {definitions.map(([key, label]) => (
          <DescriptionListGroup key={key}>
            <DescriptionListTerm>{label}</DescriptionListTerm>
            <DescriptionListDescription>
              <PipelineConfiguration definition={pipeline[key]} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        ))}
      </DescriptionList>
      {!definitions.length && <p>No pipeline configured</p>}
    </DetailsSection>
  );
};

export default ComponentBuildSettings;
