import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, EmptyStateBody, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { FLAGS } from '~/feature-flags/flags';
import { IfFeature } from '~/feature-flags/hooks';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import { getErrorState } from '~/shared/utils/error-utils';
import { getComponentVersion } from '~/utils/version-utils';
import emptyStateImgUrl from '../../assets/Components.svg';
import { useComponent } from '../../hooks/useComponents';
import {
  COMPONENTS_PATH,
  COMPONENT_DETAILS_V2_PATH,
  COMPONENT_VERSIONS_PATH,
  COMPONENT_VERSION_DETAILS_PATH,
} from '../../routes/paths';
import { RouterParams } from '../../routes/utils';
import { useNamespace } from '../../shared/providers/Namespace/useNamespaceInfo';
import { DetailsPage } from '../DetailsPage';

const ComponentVersionDetailsView: React.FC = () => {
  const { componentName, versionRevision } = useParams<RouterParams>();
  const namespace = useNamespace();
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

  return (
    <IfFeature
      flag="components-page"
      fallback={
        <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Feature flag disabled">
          <EmptyStateBody>
            {`To view this page, enable the "${FLAGS['components-page'].description}" feature flag.`}
          </EmptyStateBody>
        </AppEmptyState>
      }
    >
      <DetailsPage
        data-test="version-details-test-id"
        headTitle={versionRevision}
        title={
          <Text component={TextVariants.h2}>
            {component.metadata.name} <FeatureFlagIndicator flags={['components-page']} fullLabel />
          </Text>
        }
        breadcrumbs={[
          {
            path: COMPONENTS_PATH.createPath({ workspaceName: namespace }),
            name: 'Components',
          },
          {
            path: COMPONENT_DETAILS_V2_PATH.createPath({
              workspaceName: namespace,
              componentName,
            }),
            name: component.spec.componentName || componentName,
          },
          {
            path: COMPONENT_VERSIONS_PATH.createPath({ workspaceName: namespace, componentName }),
            name: 'Versions',
          },
          {
            path: COMPONENT_VERSION_DETAILS_PATH.createPath({
              workspaceName: namespace,
              componentName,
              versionRevision,
            }),
            name: version.name,
          },
        ]}
        baseURL={COMPONENT_VERSION_DETAILS_PATH.createPath({
          workspaceName: namespace,
          componentName,
          versionRevision,
        })}
        tabs={[
          {
            key: 'index',
            label: 'Overview',
            isFilled: true,
          },
          {
            key: 'activity',
            label: 'Activity',
          },
        ]}
      />
    </IfFeature>
  );
};

export default ComponentVersionDetailsView;
