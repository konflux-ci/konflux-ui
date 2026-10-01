import { SNAPSHOT_LIST_PATH } from '@routes/paths';
import { registerTour, type TourConfig } from '~/shared/components/GuidedTours';

/**
 * Guided tour for the Sort Dropdown on the Snapshots list page.
 *
 * Single-step hint that highlights the sort dropdown icon so new users
 * discover they can sort snapshots by column.
 */

export const snapshotsSortDropdownTour: TourConfig = {
  id: 'snapshots-sort-dropdown',
  route: SNAPSHOT_LIST_PATH.path,
  trigger: 'auto',
  priority: 0,
  steps: [
    {
      type: 'highlight',
      title: 'Sort dropdown',
      content:
        'Sort snapshots by any sortable column such as Name or Created at. ' +
        'Toggle between ascending and descending order.',
      target: 'snapshots-sort-dropdown',
      position: 'bottom',
    },
  ],
};

registerTour(snapshotsSortDropdownTour);
