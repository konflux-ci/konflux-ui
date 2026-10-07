import React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { DetailsPage } from '~/components/DetailsPage';
import { FeatureFlagIndicator } from '~/feature-flags/FeatureFlagIndicator';
import { useComponentGroup } from '~/hooks/useComponentGroups';
import { GROUP_DETAILS_PATH } from '~/routes/paths';
import { RouterParams } from '~/routes/utils';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { useComponentGroupBreadcrumbs } from '../breadcrumb-utils';

const ComponentGroupDetailsView: React.FC = () => {
  const { groupName } = useParams<RouterParams>();
  const namespace = useNamespace();

  const [componentGroup, loaded, error] = useComponentGroup(namespace, groupName);

  const componentGroupBreadcrumbs = useComponentGroupBreadcrumbs(groupName);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'component group');
  }

  return (
    <>
      <DetailsPage
        headTitle={componentGroup?.metadata?.name || 'Unknown'}
        title={
          <Content component={ContentVariants.h2}>
            <b>{componentGroup?.metadata?.name}</b>
            <FeatureFlagIndicator flags={['component-model']} />
          </Content>
        }
        breadcrumbs={componentGroupBreadcrumbs}
        baseURL={GROUP_DETAILS_PATH.createPath({ workspaceName: namespace, groupName })}
        tabs={[
          {
            key: 'components',
            label: 'Components',
          },
          {
            key: 'pipelineruns',
            label: 'Pipeline runs',
          },
          {
            key: 'integrationtests',
            label: 'Integration tests',
          },
          {
            key: 'snapshots',
            label: 'Snapshots',
          },
          {
            key: 'releases',
            label: 'Releases',
          },
        ]}
      />
    </>
  );
};

export default ComponentGroupDetailsView;
