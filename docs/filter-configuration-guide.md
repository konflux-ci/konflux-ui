# Filter Configuration Guide

## Overview

This guide explains the best practices for configuring filters in the Konflux UI using the generic filter system.

## ✅ Preferred Approach: getOptions Function

**Always use the `getOptions` function method for all `multiSelect` and `singleSelect` filters.** This is the standardized approach across the codebase.

### Why getOptions is Preferred

1. **Dynamic counting**: Automatically counts occurrences in the current data
2. **Real-time updates**: Options update as data changes
3. **Better performance**: More efficient than generic data extraction
4. **Type safety**: Full TypeScript support with proper typing
5. **Flexibility**: Complete control over option generation logic

### Example Implementation

```typescript
const filterConfigs: FilterConfig[] = [
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    mode: 'client',
    getOptions: (data: PipelineRunKind[]) => {
      const statusMap = new Map<string, number>();
      data.forEach((item) => {
        const status = getStatus(item);
        if (status) {
          statusMap.set(status, (statusMap.get(status) || 0) + 1);
        }
      });
      return Array.from(statusMap.entries()).map(([value, count]) => ({
        value,
        label: value,
        count,
      }));
    },
    filterFn: (item: PipelineRunKind, value: string[]) => {
      if (!Array.isArray(value) || value.length === 0) return true;
      return value.includes(getStatus(item));
    },
  },
];
```

### Pattern for getOptions

Follow this consistent pattern for all `getOptions` implementations:

1. **Create a Map**: Use `Map<string, number>` to count occurrences
2. **Iterate data**: Loop through the data array
3. **Extract values**: Get the relevant value from each item
4. **Count occurrences**: Track how many times each value appears
5. **Return FilterOption[]**: Map to the required format with `value`, `label`, and `count`

## 🔍 Search Filters Exception

For `search` type filters, use `searchAttributes` configuration:

```typescript
{
  type: 'search',
  param: 'search',
  mode: 'client',
  searchAttributes: {
    attributes: [
      { key: 'name', label: 'Name' },
      { key: 'commit', label: 'Commit' },
    ],
    defaultAttribute: 'name',
    getPlaceholder: (attribute) => `Filter by ${attribute.toLowerCase()}...`,
  },
}
```

## ⚠️ Deprecated Methods

### DO NOT USE: Static Options

```typescript
// ❌ DEPRECATED - Don't use static options
options: [
  { value: 'status1', label: 'Status 1' },
  { value: 'status2', label: 'Status 2' },
]
```

### DO NOT USE: optionsSource

```typescript
// ❌ DEPRECATED - Don't use optionsSource
optionsSource: {
  from: 'data',
  key: 'status',
  labelFormatter: (value) => String(value),
}
```

## Migration Guide

If you encounter legacy filter configurations using deprecated methods:

1. **Replace `options`** with `getOptions` function
2. **Replace `optionsSource`** with `getOptions` function  
3. **Add proper TypeScript typing** for the data parameter
4. **Include `filterFn`** for client-side filtering logic

## Existing Examples

See these files for reference implementations:
- `src/components/SnapshotDetails/tabs/SnapshotPipelineRunsList.tsx`
- `src/components/Commits/CommitDetails/tabs/CommitsPipelineRunTab.tsx`
- `src/components/PipelineRun/PipelineRunListView/PipelineRunsListView.tsx`

All follow the preferred `getOptions` pattern consistently.
