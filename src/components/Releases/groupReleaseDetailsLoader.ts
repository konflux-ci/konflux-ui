import { RouterParams } from '@routes/utils';
import { ReleaseLabel } from '~/consts/release';
import { ensureFeatureFlagOnLoader } from '~/feature-flags/utils';
import { HttpError } from '~/k8s/error';
import { fetchResourceWithK8sAndKubeArchive } from '~/kubearchive/resource-utils';
import { ReleaseModel } from '~/models';
import { ReleaseKind } from '~/types';
import { createLoaderWithAccessCheck } from '~/utils/rbac';

export const groupReleaseDetailsLoader = createLoaderWithAccessCheck(
  async ({ params }) => {
    ensureFeatureFlagOnLoader('component-model');
    const { resource } = await fetchResourceWithK8sAndKubeArchive<ReleaseKind>({
      model: ReleaseModel,
      queryOptions: {
        ns: params[RouterParams.workspaceName],
        name: params[RouterParams.releaseName],
      },
    });
    if (resource.metadata.labels?.[ReleaseLabel.COMPONENT_GROUP] !== params[RouterParams.groupName])
      throw HttpError.fromCode(404);
    return resource;
  },
  { model: ReleaseModel, verb: 'get' },
);
