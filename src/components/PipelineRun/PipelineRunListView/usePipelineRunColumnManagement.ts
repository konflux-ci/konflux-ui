import { useColumnManagement } from '../../../shared/hooks/useColumnManagement';
import { PipelineRunColumnKey, defaultStandardColumns } from './PipelineRunListHeader';

const STORAGE_KEY = 'konflux-pipelinerun-visible-columns';
const REQUIRED_COLUMNS: PipelineRunColumnKey[] = ['name', 'kebab'];

export const usePipelineRunColumnManagement = () => {
  return useColumnManagement<PipelineRunColumnKey>({
    defaultVisibleColumns: defaultStandardColumns,
    storageKey: STORAGE_KEY,
    requiredColumns: REQUIRED_COLUMNS,
  });
}; 