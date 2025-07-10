import React from 'react';
import { Button, PageSection, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
import { Table } from '../../../shared/components/table';
import { PipelineRunKind } from '../../../types';
import { createPipelineRunListHeader } from './PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from './PipelineRunListRow';
import { usePipelineRunColumnManagement } from './usePipelineRunColumnManagement';
import PipelineRunColumnManagement from './PipelineRunColumnManagement';

type PipelineRunListViewWithColumnManagementProps = {
  pipelineRuns: PipelineRunKind[];
  loaded: boolean;
  customData?: any;
  EmptyMsg?: React.ComponentType;
  NoDataEmptyMsg?: React.ComponentType;
};

const PipelineRunListViewWithColumnManagement: React.FC<PipelineRunListViewWithColumnManagementProps> = ({
  pipelineRuns,
  loaded,
  customData,
  EmptyMsg,
  NoDataEmptyMsg,
}) => {
  const {
    visibleColumns,
    isColumnManagementOpen,
    openColumnManagement,
    closeColumnManagement,
    handleVisibleColumnsChange,
  } = usePipelineRunColumnManagement();

  const Header = React.useMemo(() => createPipelineRunListHeader(visibleColumns), [visibleColumns]);

  const Row = React.useCallback(
    (props: any) => <PipelineRunListRowWithColumns {...props} visibleColumns={visibleColumns} />,
    [visibleColumns],
  );

  return (
    <PageSection>
      <Toolbar>
        <ToolbarContent>
          <ToolbarItem>
            <Button
              variant="plain"
              aria-label="Manage columns"
              onClick={openColumnManagement}
              icon={<CogIcon />}
            >
              Manage columns
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>
      
      <Table
        data={pipelineRuns}
        aria-label="Pipeline runs"
        Header={Header}
        Row={Row}
        loaded={loaded}
        customData={customData}
        EmptyMsg={EmptyMsg}
        NoDataEmptyMsg={NoDataEmptyMsg}
        getRowProps={(obj: PipelineRunKind) => ({
          id: obj.metadata.name,
        })}
      />
      
      <PipelineRunColumnManagement
        isOpen={isColumnManagementOpen}
        onClose={closeColumnManagement}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={handleVisibleColumnsChange}
      />
    </PageSection>
  );
};

export default PipelineRunListViewWithColumnManagement; 