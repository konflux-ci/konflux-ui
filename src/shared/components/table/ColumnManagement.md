# Column Management Component

A generic, reusable column management component for PatternFly tables that allows users to show/hide columns and persist their preferences.

## Features

- **Generic**: Works with any column type using TypeScript generics
- **Persistent**: Saves column visibility preferences to localStorage
- **Customizable**: Supports required columns that cannot be hidden
- **Accessible**: Built with PatternFly components for consistent UI/UX
- **Type-safe**: Full TypeScript support with proper type inference

## Usage

### Basic Setup

1. Define your column types and definitions:

```typescript
// Define column keys
type MyColumnKey = 'name' | 'created' | 'status' | 'actions';

// Define column definitions
const columns: ColumnDefinition<MyColumnKey>[] = [
  { key: 'name', title: 'Name', className: 'name-class', sortable: true },
  { key: 'created', title: 'Created', className: 'created-class', sortable: true },
  { key: 'status', title: 'Status', className: 'status-class' },
  { key: 'actions', title: '', className: 'actions-class' },
];

// Define default visible columns
const defaultVisibleColumns = new Set<MyColumnKey>(['name', 'created', 'status', 'actions']);

// Define required columns (cannot be hidden)
const requiredColumns: MyColumnKey[] = ['name', 'actions'];
```

2. Use the hook for state management:

```typescript
import { useColumnManagement } from '../../../shared/hooks/useColumnManagement';

export const useMyColumnManagement = () => {
  return useColumnManagement<MyColumnKey>({
    defaultVisibleColumns,
    storageKey: 'my-table-columns',
    requiredColumns,
  });
};
```

3. Use the component in your table view:

```typescript
import ColumnManagement from '../../../shared/components/table/ColumnManagement';
import { useMyColumnManagement } from './useMyColumnManagement';

const MyTableView = () => {
  const {
    visibleColumns,
    isColumnManagementOpen,
    openColumnManagement,
    closeColumnManagement,
    handleVisibleColumnsChange,
    isColumnVisible,
  } = useMyColumnManagement();

  return (
    <>
      {/* Your table component */}
      <Table
        columns={columns.filter(col => isColumnVisible(col.key))}
        // ... other props
      />
      
      {/* Column management modal */}
      <ColumnManagement
        isOpen={isColumnManagementOpen}
        onClose={closeColumnManagement}
        visibleColumns={visibleColumns}
        onVisibleColumnsChange={handleVisibleColumnsChange}
        columns={columns}
        defaultVisibleColumns={defaultVisibleColumns}
        nonHidableColumns={requiredColumns}
        title="Manage table columns"
        description="Select which columns to display in the table."
      />
    </>
  );
};
```

### Component Props

#### `ColumnManagement<T>`

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | ✅ | Whether the modal is open |
| `onClose` | `() => void` | ✅ | Callback when modal is closed |
| `visibleColumns` | `Set<T>` | ✅ | Currently visible columns |
| `onVisibleColumnsChange` | `(columns: Set<T>) => void` | ✅ | Callback when columns change |
| `columns` | `readonly ColumnDefinition<T>[]` | ✅ | All available columns |
| `defaultVisibleColumns` | `Set<T>` | ✅ | Default visible columns |
| `nonHidableColumns` | `readonly T[]` | ✅ | Columns that cannot be hidden |
| `title` | `string` | ❌ | Modal title (default: "Manage columns") |
| `description` | `string` | ❌ | Modal description (default: "Selected columns will be displayed in the table.") |

#### `useColumnManagement<T>`

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `defaultVisibleColumns` | `Set<T>` | ✅ | Default visible columns |
| `storageKey` | `string` | ✅ | localStorage key for persistence |
| `requiredColumns` | `T[]` | ❌ | Columns that must always be visible |

### Hook Return Values

The `useColumnManagement` hook returns:

| Property | Type | Description |
|----------|------|-------------|
| `visibleColumns` | `Set<T>` | Currently visible columns |
| `isColumnManagementOpen` | `boolean` | Whether the management modal is open |
| `openColumnManagement` | `() => void` | Function to open the modal |
| `closeColumnManagement` | `() => void` | Function to close the modal |
| `handleVisibleColumnsChange` | `(columns: Set<T>) => void` | Function to update visible columns |
| `isColumnVisible` | `(columnKey: T) => boolean` | Function to check if a column is visible |

## Example: Converting Existing Components

### Before (Snapshot-specific)

```typescript
// SnapshotsColumnManagement.tsx
const SnapshotsColumnManagement: React.FC<SnapshotsColumnManagementProps> = ({
  isOpen,
  onClose,
  visibleColumns,
  onVisibleColumnsChange,
}) => {
  // ... 100+ lines of component logic
};
```

### After (Generic)

```typescript
// SnapshotsColumnManagement.tsx
const SnapshotsColumnManagement: React.FC<SnapshotsColumnManagementProps> = ({
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
      columns={snapshotColumns}
      defaultVisibleColumns={defaultVisibleColumns}
      nonHidableColumns={NON_HIDABLE_COLUMNS}
    />
  );
};
```

## Benefits

1. **Reusability**: One component works for all table types
2. **Consistency**: Same UI/UX across all tables
3. **Maintainability**: Single source of truth for column management logic
4. **Type Safety**: Full TypeScript support prevents runtime errors
5. **Testability**: Well-tested generic component with comprehensive test coverage

## Testing

The component includes comprehensive tests covering:
- Modal rendering and interaction
- Column toggling and persistence
- Error handling for localStorage
- Default behavior and customization
- TypeScript type safety

See `__tests__/ColumnManagement.spec.tsx` and `__tests__/useColumnManagement.spec.ts` for examples. 