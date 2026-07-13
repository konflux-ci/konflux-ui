import { runStatus } from '~/consts/pipelinerun';
import { useFaviconStatusBadge } from '~/shared/hooks/useFaviconStatusBadge';
import { getStatusColor } from '~/utils/status-color-utils';

/** Updates the favicon badge based on a run status. */
export const useStatusOnFavicon = (status: runStatus): void => {
  useFaviconStatusBadge(getStatusColor(status));
};
