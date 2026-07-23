import { runStatus } from '~/consts/pipelinerun';
import { useFaviconStatusBadge } from '~/shared/hooks/useFaviconStatusBadge';
import { getStatusColor } from '~/utils/status-color-utils';

/** Updates the favicon badge based on a run status. Pass null to skip until status is known. */
export const useStatusOnFavicon = (status: runStatus | null): void => {
  useFaviconStatusBadge(status ? getStatusColor(status) : null);
};
