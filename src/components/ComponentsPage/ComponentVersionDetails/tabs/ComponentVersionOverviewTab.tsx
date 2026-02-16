import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Spinner,
} from '@patternfly/react-core';
import { DetailsSection } from '~/components/DetailsPage';
import GitRepoLink from '~/components/GitLink/GitRepoLink';
import { useComponent } from '~/hooks/useComponents';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';
import ComponentVersionLatestBuild from './ComponentVersionLatestBuild';

const ComponentVersionOverviewTab: React.FC = () => {
  const { componentName, versionName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName ?? '');

  if (!componentName || !versionName) return null;
  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, loaded, 'component');
  }

  if (!component) {
    return null;
  }

  return (
    <div className="component-version-details">
      <DetailsSection title="Git branch and pipeline">
        <DescriptionList
          columnModifier={{
            default: '1Col',
          }}
        >
          <DescriptionListGroup>
            <DescriptionListTerm>Branch</DescriptionListTerm>
            <DescriptionListDescription>{versionName ?? '-'}</DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>Repository</DescriptionListTerm>
            <DescriptionListDescription>
              <GitRepoLink url={component.spec?.source?.url} />
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </DetailsSection>
      <DetailsSection
        title="Latest build"
        description="All information is based on the latest successful build of this component for this branch."
      >
        <ComponentVersionLatestBuild component={component} branchName={versionName ?? ''} />
      </DetailsSection>
    </div>
  );
};

export default ComponentVersionOverviewTab;
