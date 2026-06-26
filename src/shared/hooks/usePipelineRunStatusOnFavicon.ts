import { runStatus } from '~/consts/pipelinerun';
import { getColorForPipelineStatus } from '~/shared/utils/status-color-utils';
import { useFaviconStatusBadge } from './useFaviconStatusBadge';

/** Updates the favicon badge based on a pipeline run status. */
export const usePipelineRunStatusOnFavicon = (status: runStatus): void => {
  useFaviconStatusBadge(getColorForPipelineStatus(status));
};
