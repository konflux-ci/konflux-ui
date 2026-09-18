import { PIPELINE_RUNS_PAGE_PATH } from '@routes/paths';
import { registerTour, type TourConfig } from '~/shared/components/GuidedTours';

/**
 * Guided tour for the Pipeline Runs page.
 *
 * Walks new users through the page layout: navigation, filters,
 * column management, archive toggle, and saved views.
 */

export const pipelineRunsTour: TourConfig = {
  id: 'pipeline-runs-page',
  route: PIPELINE_RUNS_PAGE_PATH.path,
  trigger: 'auto',
  priority: 0,
  steps: [
    {
      type: 'highlight',
      title: 'Search filter',
      content:
        'Search by pipeline run name or pull request number. ' +
        'Use the dropdown to switch between search fields.',
      target: 'pipeline-runs-search-filter',
      position: 'bottom',
    },
    {
      type: 'highlight',
      title: 'Server-side filters',
      content:
        'Application, Component, and Event type filters are sent to the server. ' +
        'Select at least one Application or Component to load pipeline runs.',
      target: 'pipeline-runs-server-filters',
      position: 'bottom',
    },
    {
      type: 'highlight',
      title: 'Client-side filters',
      content:
        'Status and Type filters are applied locally after data is fetched. ' +
        'Use them to narrow down visible results without additional server requests.',
      target: 'pipeline-runs-client-filters',
      position: 'bottom',
    },
    {
      type: 'highlight',
      title: 'Sort dropdown',
      content:
        'Sort pipeline runs by any sortable column such as Name, Started, Duration, or Status. ' +
        'Toggle between ascending and descending order.',
      target: 'pipeline-runs-sort-dropdown',
      position: 'bottom',
    },
    {
      type: 'highlight',
      title: 'Column management',
      content:
        'Click the table icon to show or hide columns. ' +
        'Reorder and customise which columns are visible to focus on the information you need.',
      target: 'pipeline-runs-column-management',
      position: 'bottom',
    },
    {
      type: 'highlight',
      title: 'Include archived runs',
      content:
        'Toggle this option to include archived pipeline runs in the results. ' +
        'By default, only active runs are shown.',
      target: 'pipeline-runs-archive-toggle',
      position: 'bottom',
    },
    {
      type: 'highlight',
      title: 'Save view',
      content:
        'Save your current filter and column configuration as a named view. ' +
        'Saved views appear in the sidebar for quick access.',
      target: 'pipeline-runs-saved-view-actions',
      position: 'left',
    },
    {
      type: 'modal',
      title: 'You are all set!',
      content:
        'Those are the main features of the Pipeline Runs page. ' +
        'You can replay this tour anytime from the Help menu.',
      closing: true,
    },
  ],
};

registerTour(pipelineRunsTour);
