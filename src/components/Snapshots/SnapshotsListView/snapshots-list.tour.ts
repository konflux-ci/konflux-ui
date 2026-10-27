import { SNAPSHOT_LIST_PATH } from '@routes/paths';
import type { TourConfig } from '~/shared/components/GuidedTours';

export const snapshotListSortTour: TourConfig = {
  id: 'application-snapshot-list-sort',
  route: SNAPSHOT_LIST_PATH.path,
  trigger: 'auto',
  steps: [
    {
      type: 'highlight',
      title: 'Sort snapshots',
      content:
        'Select a column to sort snapshots. Select it again to clear the sort and restore the original order. Choose Ascending or Descending to change the sort direction.',
      target: 'snapshots-list-sort-dropdown',
    },
  ],
};
