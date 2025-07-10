# PipelineRun Column Management

This directory contains the implementation of column management for PipelineRun list views using the generic column management system.

## Overview

The PipelineRun column management allows users to show/hide columns in pipeline run tables and persists their preferences in localStorage. It's built on top of the generic column management system in `src/shared/components/table/ColumnManagement.tsx`.

## Components

### 1. Column Definitions (`PipelineRunListHeader.tsx`)

- **`pipelineRunColumns`**: Array of all available columns with their properties
- **`PipelineRunColumnKey`**: TypeScript type for column keys
- **`defaultStandardColumns`**: Default columns for standard pipeline run views
- **`defaultVulnerabilityColumns`**: Default columns for vulnerability-focused views
- **`defaultReleaseColumns`**: Default columns for release-focused views
- **`createPipelineRunListHeader`**: Function to create table headers based on visible columns

### 2. Column Management Hook (`usePipelineRunColumnManagement.ts`)

A custom hook that provides column management functionality:

```typescript
const {
  visibleColumns,
  isColumnManagementOpen,
  openColumnManagement,
  closeColumnManagement,
  handleVisibleColumnsChange,
  isColumnVisible,
} = usePipelineRunColumnManagement();
```

### 3. Column Management Component (`PipelineRunColumnManagement.tsx`)

A modal component for managing column visibility:

```typescript
<PipelineRunColumnManagement
  isOpen={isColumnManagementOpen}
  onClose={closeColumnManagement}
  visibleColumns={visibleColumns}
  onVisibleColumnsChange={handleVisibleColumnsChange}
/>
```

### 4. Enhanced Row Component (`PipelineRunListRow.tsx`)

- **`PipelineRunListRowWithColumns`**: New row component that renders columns based on visibility
- Legacy row components remain for backward compatibility

## Available Columns

| Column Key | Title | Description |
|------------|-------|-------------|
| `name` | Name | Pipeline run name (required) |
| `started` | Started | When the pipeline run started |
| `vulnerabilities` | Fixable vulnerabilities | Security scan results |
| `duration` | Duration | How long the pipeline run took |
| `status` | Status | Current pipeline run status |
| `testResultStatus` | Test result | Integration test results |
| `type` | Type | Pipeline run type (build, test, etc.) |
| `component` | Component | Associated component |
| `snapshot` | Snapshot | Associated snapshot |
| `workspace` | Namespace | Kubernetes namespace |
| `trigger` | Trigger | What triggered the pipeline run |
| `reference` | Reference | Git reference (branch, PR, etc.) |
| `kebab` | Actions | Action menu (required) |

## Usage Example

### Basic Implementation

```typescript
import React from 'react';
import { Button, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { CogIcon } from '@patternfly/react-icons';
import { Table } from '../../../shared/components/table';
import { createPipelineRunListHeader } from './PipelineRunListHeader';
import { PipelineRunListRowWithColumns } from './PipelineRunListRow';
import { usePipelineRunColumnManagement } from './usePipelineRunColumnManagement';
import PipelineRunColumnManagement from './PipelineRunColumnManagement';

const MyPipelineRunList = ({ pipelineRuns, loaded, customData }) => {
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
    <>
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
        getRowProps={(obj) => ({ id: obj.metadata.name })}
      />
      
      <PipelineRunColumnManagement
        isOpen={isColumnManagementOpen}
        onClose={closeColumnManagement}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={handleVisibleColumnsChange}
      />
    </>
  );
};
```

### Custom Column Sets

You can create custom column sets for different contexts:

```typescript
// Custom column set for a specific use case
const customColumns = new Set<PipelineRunColumnKey>([
  'name',
  'started',
  'status',
  'vulnerabilities',
  'component',
  'kebab',
]);

const Header = createPipelineRunListHeader(customColumns);
```

## Migration from Legacy System

### Before (Legacy)
```typescript
// Using boolean flags for each column
const Header = createPipelineRunListHeaderLegacy(
  true,  // showVulnerabilities
  false, // showWorkspace
  true,  // showTestResult
  true,  // showComponent
  false, // showSnapshot
  true,  // showTrigger
  true,  // showReference
);
```

### After (Column Management)
```typescript
// Using column sets with user control
const {
  visibleColumns,
  isColumnManagementOpen,
  openColumnManagement,
  closeColumnManagement,
  handleVisibleColumnsChange,
} = usePipelineRunColumnManagement();

const Header = React.useMemo(() => createPipelineRunListHeader(visibleColumns), [visibleColumns]);
```

## Backward Compatibility

The legacy header creation functions remain available for gradual migration:

- `PipelineRunListHeader`
- `PipelineRunListHeaderWithVulnerabilities`
- `PipelineRunListHeaderForRelease`

These use the `createPipelineRunListHeaderLegacy` function internally.

## Testing

The implementation includes comprehensive tests:

- **Unit tests** for the column management component
- **Integration tests** for the complete workflow
- **Type safety tests** to ensure TypeScript compatibility

Run tests:
```bash
npm test PipelineRunColumnManagement
```

## Benefits

1. **User Control**: Users can customize which columns are visible
2. **Persistence**: Column preferences are saved in localStorage
3. **Flexibility**: Easy to add new columns or create custom column sets
4. **Consistency**: Uses the same UI/UX as other column management components
5. **Performance**: Only renders visible columns, reducing DOM size
6. **Accessibility**: Proper labeling and keyboard navigation support

## Storage

Column preferences are stored in localStorage with the key:
`konflux-pipelinerun-visible-columns`

The stored data is a JSON array of column keys:
```json
["name", "started", "status", "duration", "type", "component", "kebab"]
```

## Future Enhancements

- Column reordering via drag and drop
- Column width persistence
- Custom column groups/presets
- Export/import column configurations
- Column sorting preferences 