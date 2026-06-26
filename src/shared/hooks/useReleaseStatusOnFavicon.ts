import { runStatus } from '~/consts/pipelinerun';
import { getColorForReleaseStatus } from '~/shared/utils/status-color-utils';
import { useFaviconStatusBadge } from './useFaviconStatusBadge';

/** Updates the favicon badge based on a release status. */
export const useReleaseStatusOnFavicon = (status: runStatus): void => {
  useFaviconStatusBadge(getColorForReleaseStatus(status));
};
