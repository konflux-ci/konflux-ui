import { pipelineRunsTour } from '~/components/PipelineRunsPage/pipeline-runs.tour';
import { snapshotListSortTour } from '~/components/Snapshots/SnapshotsListView/snapshots-list.tour';
import { registerTour } from '~/shared/components/GuidedTours';

registerTour(pipelineRunsTour);
registerTour(snapshotListSortTour);
