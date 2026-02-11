import * as React from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bullseye, Spinner, List, ListItem, Title } from '@patternfly/react-core';
import { DetailsSection } from '~/components/DetailsPage';
import { useComponentBranches } from '~/hooks/useComponentBranches';
import { useComponent } from '~/hooks/useComponents';
import { COMPONENT_VERSION_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentVersionsTab: React.FC = () => {
  const { componentName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [component, componentLoaded, componentError] = useComponent(
    namespace,
    componentName ?? '',
    true,
  );
  const [branches, branchesLoaded, branchesError] = useComponentBranches(
    namespace,
    component?.metadata?.name ?? componentName ?? undefined,
  );

  if (!componentName) {
    return null;
  }

  if (!componentLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (componentError) {
    return getErrorState(componentError, componentLoaded, 'component');
  }

  if (!branchesLoaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (branchesError) {
    return getErrorState(branchesError, branchesLoaded, 'branches', true);
  }

  return (
    <DetailsSection
      title="Versions"
      description="Branches that have pipeline runs for this component. Select a branch to view its overview and activity."
    >
      {branches.length === 0 ? (
        <p>No branches with pipeline runs found for this component.</p>
      ) : (
        <List isPlain isBordered data-test="component-versions-list">
          {branches.map((branch) => (
            <ListItem key={branch}>
              <Link
                to={COMPONENT_VERSION_DETAILS_PATH.createPath({
                  workspaceName: namespace,
                  componentName,
                  verName: branch,
                })}
                data-test={`version-link-${branch}`}
              >
                <Title headingLevel="h4" size="md">
                  {branch}
                </Title>
              </Link>
            </ListItem>
          ))}
        </List>
      )}
    </DetailsSection>
  );
};

export default ComponentVersionsTab;
