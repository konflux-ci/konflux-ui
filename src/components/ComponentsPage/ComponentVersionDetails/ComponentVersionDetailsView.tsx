import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, EmptyStateBody, Spinner, Text, TextVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Components.svg';
import { DetailsPage } from '~/components/DetailsPage';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { FLAGS } from '~/feature-flags/flags';
import { IfFeature } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import {
  COMPONENT_DETAILS_V2_PATH,
  COMPONENTS_PATH,
  COMPONENT_VERSION_DETAILS_PATH,
} from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentVersionDetailsView: React.FC = () => {
  const { componentName, verName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName ?? '');

  if (!componentName || !verName) {
    return null;
  }

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
        data-test="component-version-details-test-id"
        headTitle={`${component.spec.componentName} - ${verName}`}
        title={
          <Text component={TextVariants.h2}>
            {verName} <FeatureFlagIndicator flags={['components-page']} fullLabel />
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
            name: component.spec.componentName,
          },
          {
            path: COMPONENT_VERSION_DETAILS_PATH.createPath({
              workspaceName: namespace,
              componentName,
              verName,
            }),
            name: verName,
          },
        ]}
        baseURL={COMPONENT_VERSION_DETAILS_PATH.createPath({
          workspaceName: namespace,
          componentName,
          verName,
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
