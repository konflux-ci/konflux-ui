import { Link, useParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { COMPONENT_DETAILS_V2_PATH, GROUP_SNAPSHOT_DETAILS_PATH } from '@routes/paths';
import { RouterParams } from '@routes/utils';
import ReleaseMetadata from '~/components/Releases/ReleaseMetadata';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { useRelease } from '~/hooks/useReleases';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';

const GroupReleaseOverviewTab = () => {
  const { releaseName, groupName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, loaded, error] = useRelease(namespace, releaseName);
  if (!loaded)
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'release');
  if (!release) return getErrorState({ code: 404 }, loaded, 'release');
  const componentName = release.metadata.labels?.[PipelineRunLabel.COMPONENT];
  return (
    <ReleaseMetadata
      release={release}
      namespace={namespace}
      component={
        componentName ? (
          <Link
            to={COMPONENT_DETAILS_V2_PATH.createPath({ workspaceName: namespace, componentName })}
          >
            {componentName}
          </Link>
        ) : (
          '-'
        )
      }
      snapshot={
        <Link
          to={GROUP_SNAPSHOT_DETAILS_PATH.createPath({
            workspaceName: namespace,
            groupName,
            snapshotName: release.spec.snapshot,
          })}
          state={{ type: 'snapshot' }}
        >
          {release.spec.snapshot}
        </Link>
      }
    />
  );
};
export default GroupReleaseOverviewTab;
