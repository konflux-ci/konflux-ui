import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Bullseye, Spinner, Content, ContentVariants } from '@patternfly/react-core';
import { GROUP_RELEASE_DETAILS_PATH, GROUP_RELEASE_LIST_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import { useAuth } from '~/auth/useAuth';
import { useComponentGroupBreadcrumbs } from '~/components/ComponentGroups/breadcrumb-utils';
import { DetailsPage } from '~/components/DetailsPage';
import { ReleaseLabel } from '~/consts/release';
import { useRelease } from '~/hooks/useReleases';
import { getReleaseStatus } from '~/hooks/useReleaseStatus';
import { useStatusOnFavicon } from '~/hooks/useStatusOnFavicon';
import { ReleaseModel } from '~/models';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { TrackEvents, useTrackEvent } from '~/utils/analytics';
import { downloadYaml } from '~/utils/common-utils';
import { useAccessReviewForModel } from '~/utils/rbac';
import { releaseRerun } from '~/utils/release-actions';

const GroupReleaseDetailsView: React.FC = () => {
  const { groupName, releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const navigate = useNavigate();

  const groupBreadcrumbs = useComponentGroupBreadcrumbs(groupName);

  const [release, loaded, error] = useRelease(namespace, releaseName);
  const [canCreateRelease] = useAccessReviewForModel(ReleaseModel, 'create');
  const track = useTrackEvent();
  const {
    user: { email },
  } = useAuth();

  const releaseStatus = React.useMemo(
    () => (loaded && release && !error ? getReleaseStatus(release) : null),
    [loaded, release, error],
  );
  useStatusOnFavicon(releaseStatus);

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'release');
  }

  if (!release || release.metadata.labels?.[ReleaseLabel.COMPONENT_GROUP] !== groupName) {
    return getErrorState({ code: 404 }, loaded, 'release');
  }

  return (
    <DetailsPage
      headTitle={release.metadata.name}
      breadcrumbs={[
        ...groupBreadcrumbs,
        {
          path: GROUP_RELEASE_LIST_PATH.createPath({
            workspaceName: namespace,
            groupName,
          }),
          name: 'Releases',
        },
        {
          path: GROUP_RELEASE_DETAILS_PATH.createPath({
            workspaceName: namespace,
            groupName,
            releaseName,
          }),
          name: release.metadata.name,
        },
      ]}
      title={
        <Content component={ContentVariants.h2}>
          <b data-test="release-name">{release.metadata.name}</b>
        </Content>
      }
      baseURL={GROUP_RELEASE_DETAILS_PATH.createPath({
        workspaceName: namespace,
        groupName,
        releaseName,
      })}
      actions={[
        {
          onClick: () => {
            track(TrackEvents.ButtonClicked, {
              link_name: 're-run-release',
              link_location: 'release-actions',
              release_name: releaseName,
              namespace,
            });
            void releaseRerun(release, email).then(() => {
              navigate(
                GROUP_RELEASE_LIST_PATH.createPath({
                  workspaceName: namespace,
                  groupName,
                }),
              );
            });
          },
          disabledTooltip: 'You do not have access to re-run release',
          isDisabled: !canCreateRelease,
          key: 're-run-release',
          label: 'Re-run release',
        },
        {
          key: 'download-release-yaml',
          label: 'Download YAML',
          onClick: () => downloadYaml(release),
        },
      ]}
      tabs={[
        {
          key: 'index',
          label: 'Overview',
          isFilled: true,
        },
        {
          key: 'pipelineruns',
          label: 'Pipeline runs',
        },
        {
          key: 'artifacts',
          label: 'Release artifacts',
          isFilled: true,
        },
        {
          key: 'yaml',
          label: 'YAML',
          isFilled: true,
        },
      ]}
    />
  );
};

export default GroupReleaseDetailsView;
