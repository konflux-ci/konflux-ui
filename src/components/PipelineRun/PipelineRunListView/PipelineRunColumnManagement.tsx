import React from 'react';
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { PipelineRunColumnKey, pipelineRunColumns, defaultVulnerabilityColumns } from './PipelineRunListHeader';

const NON_HIDABLE_COLUMNS: PipelineRunColumnKey[] = ['name', 'kebab'];

type PipelineRunColumnManagementProps = {
  isOpen: boolean;
  onClose: () => void;
  visibleColumns: Set<PipelineRunColumnKey>;
  onVisibleColumnsChange: (columns: Set<PipelineRunColumnKey>) => void;
};

const PipelineRunColumnManagement: React.FC<PipelineRunColumnManagementProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onVisibleColumnsChange,
}) => {
  return (
    <ColumnManagement
      isOpen={isOpen}
      onClose={onClose}
      visibleColumns={visibleColumns}
      onVisibleColumnsChange={onVisibleColumnsChange}
      columns={pipelineRunColumns}
      defaultVisibleColumns={defaultVulnerabilityColumns}
      nonHidableColumns={NON_HIDABLE_COLUMNS}
      title="Manage pipeline run columns"
      description="Selected columns will be displayed in the pipeline run table."
    />
  );
};

export default PipelineRunColumnManagement; 