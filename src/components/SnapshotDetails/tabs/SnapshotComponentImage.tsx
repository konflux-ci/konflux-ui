import { ClipboardCopy, Skeleton } from '@patternfly/react-core';
import { useImageProxy } from '~/hooks/useImageProxy';
import { useImageRepository } from '~/hooks/useImageRepository';
import { useIsImageControllerEnabled } from '~/image-controller/conditional-checks';
import { useNamespace } from '~/shared/providers/Namespace';
import { ImageRepositoryVisibility } from '~/types';
import { getImageUrlForVisibility } from '~/utils/component-utils';

type Props = { name: string; containerImage: string; application?: string };
const SnapshotComponentImage = ({ name, containerImage, application }: Props) => {
  const namespace = useNamespace();
  const { isImageControllerEnabled } = useIsImageControllerEnabled();
  const [urlInfo, proxyLoaded, proxyError] = useImageProxy();
  const [imageRepository, imageRepoLoaded, imageRepoError] = useImageRepository(
    namespace,
    name,
    application,
    false,
  );
  const displayImageUrl = isImageControllerEnabled
    ? getImageUrlForVisibility(
        containerImage,
        imageRepository?.spec?.image?.visibility ?? null,
        proxyError || !urlInfo ? null : urlInfo.hostname,
      )
    : containerImage;
  const isPrivate =
    isImageControllerEnabled &&
    imageRepository?.spec?.image?.visibility === ImageRepositoryVisibility.private;
  return isImageControllerEnabled &&
    ((!imageRepoLoaded && !imageRepoError) || (isPrivate && !proxyLoaded && !proxyError)) ? (
    <Skeleton aria-label="Loading image URL" />
  ) : (
    <ClipboardCopy isReadOnly hoverTip="Copy" clickTip="Copied">
      {displayImageUrl}
    </ClipboardCopy>
  );
};
export default SnapshotComponentImage;
