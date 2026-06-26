import { runStatus } from '~/consts/pipelinerun';
import { useFaviconStatusBadge } from '~/shared/hooks/useFaviconStatusBadge';
import { getColorForReleaseStatus } from '~/utils/status-color-utils';

/** Updates the favicon badge based on a release status. */
export const useReleaseStatusOnFavicon = (status: runStatus): void => {
  useFaviconStatusBadge(getColorForReleaseStatus(status));
};
