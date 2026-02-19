import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, EmptyStateBody, Spinner, Text, TextVariants } from '@patternfly/react-core';
import emptyStateImgUrl from '~/assets/Components.svg';
import { DetailsPage } from '~/components/DetailsPage';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { FLAGS } from '~/feature-flags/flags';
import { IfFeature } from '~/feature-flags/hooks';
import { useComponent } from '~/hooks/useComponents';
import { COMPONENT_VERSION_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import AppEmptyState from '~/shared/components/empty-state/AppEmptyState';
import { useNamespace } from '~/shared/providers/Namespace/useNamespaceInfo';
import { getErrorState } from '~/shared/utils/error-utils';

const ComponentVersionDetailsView: React.FC = () => {
  const { componentName, versionName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [component, loaded, componentError] = useComponent(namespace, componentName ?? '');

  if (!componentName || !versionName) {
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
        headTitle={`${component.spec.componentName} - ${versionName}`}
        title={
          <Text component={TextVariants.h2}>
            {versionName} <FeatureFlagIndicator flags={['components-page']} fullLabel />
          </Text>
        }
        baseURL={COMPONENT_VERSION_DETAILS_PATH.createPath({
          workspaceName: namespace,
          componentName,
          versionName,
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
