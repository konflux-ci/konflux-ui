import { runStatus } from '~/consts/pipelinerun';
import { useFaviconStatusBadge } from '~/shared/hooks/useFaviconStatusBadge';
import { getColorForPipelineStatus } from '~/utils/status-color-utils';

/** Updates the favicon badge based on a pipeline run status. */
export const usePipelineRunStatusOnFavicon = (status: runStatus): void => {
  useFaviconStatusBadge(getColorForPipelineStatus(status));
};
