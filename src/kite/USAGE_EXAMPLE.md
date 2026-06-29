# useIssuesWithSeverity Hook Usage

## Overview

The `useIssuesWithSeverity` hook fetches issues for specified severity levels and returns them grouped by severity. It provides control over caching and refetching behavior.

## Signature

```typescript
useIssuesWithSeverity(
  namespace: string,
  severities: IssueSeverity[],
  noRefetch?: boolean
): IssuesWithSeverityResult
```

## Parameters

- **namespace** (string): The namespace to fetch issues from
- **severities** (IssueSeverity[]): Array of severities to fetch (e.g., `[IssueSeverity.CRITICAL, IssueSeverity.MAJOR]`)
- **noRefetch** (boolean, optional): When `true`, sets `refetchOnMount: false` to prevent unnecessary refetches

## Return Value

```typescript
type IssuesWithSeverityResult = {
  data: IssuesBySeverity[];
  isLoaded: boolean;
  hasError: boolean;
};

type IssuesBySeverity = {
  severity: IssueSeverity;
  issues: Issue[];
  total: number;
  isLoading: boolean;
  error: unknown;
};
```

## Example Usage

### Basic Usage - Fetch Critical and Major Issues

```typescript
import { useIssuesWithSeverity } from '~/kite/kite-hooks';
import { IssueSeverity } from '~/kite/issue-type';

function IssuesComponent({ namespace }: { namespace: string }) {
  const { data, isLoaded, hasError } = useIssuesWithSeverity(namespace, [
    IssueSeverity.CRITICAL,
    IssueSeverity.MAJOR,
  ]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (hasError) {
    return <div>Error loading issues</div>;
  }

  return (
    <div>
      {data.map((severityGroup) => (
        <div key={severityGroup.severity}>
          <h2>{severityGroup.severity} Issues ({severityGroup.total})</h2>
          <ul>
            {severityGroup.issues.map((issue) => (
              <li key={issue.id}>{issue.title}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

### With No Refetch Option - For Static Data

```typescript
function StaticIssuesDisplay({ namespace }: { namespace: string }) {
  // noRefetch=true prevents unnecessary refetches
  const { data, isLoaded } = useIssuesWithSeverity(
    namespace,
    [IssueSeverity.CRITICAL, IssueSeverity.MAJOR, IssueSeverity.MINOR],
    true, // noRefetch
  );

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {data.map((severityGroup) => (
        <div key={severityGroup.severity}>
          <h3>{severityGroup.severity}</h3>
          <p>Total: {severityGroup.total}</p>
          {severityGroup.isLoading && <span>Loading this severity...</span>}
          {severityGroup.error && <span>Error: {String(severityGroup.error)}</span>}
        </div>
      ))}
    </div>
  );
}
```

### Fetch All Severities

```typescript
function AllIssuesComponent({ namespace }: { namespace: string }) {
  const { data, isLoaded, hasError } = useIssuesWithSeverity(namespace, [
    IssueSeverity.CRITICAL,
    IssueSeverity.MAJOR,
    IssueSeverity.MINOR,
    IssueSeverity.INFO,
  ]);

  if (!isLoaded) {
    return <div>Loading all issues...</div>;
  }

  // Access issues by severity
  const criticalIssues = data.find((d) => d.severity === IssueSeverity.CRITICAL)?.issues || [];
  const majorIssues = data.find((d) => d.severity === IssueSeverity.MAJOR)?.issues || [];

  return (
    <div>
      <section>
        <h2>Critical Issues ({criticalIssues.length})</h2>
        {criticalIssues.map((issue) => (
          <div key={issue.id}>{issue.title}</div>
        ))}
      </section>
      <section>
        <h2>Major Issues ({majorIssues.length})</h2>
        {majorIssues.map((issue) => (
          <div key={issue.id}>{issue.title}</div>
        ))}
      </section>
    </div>
  );
}
```

### Handle Per-Severity Loading and Errors

```typescript
function DetailedIssuesComponent({ namespace }: { namespace: string }) {
  const { data, isLoaded } = useIssuesWithSeverity(namespace, [
    IssueSeverity.CRITICAL,
    IssueSeverity.MAJOR,
  ]);

  return (
    <div>
      {data.map((severityGroup) => (
        <div key={severityGroup.severity}>
          <h2>{severityGroup.severity} Issues</h2>
          {severityGroup.isLoading ? (
            <div>Loading {severityGroup.severity} issues...</div>
          ) : severityGroup.error ? (
            <div>Error loading {severityGroup.severity} issues</div>
          ) : (
            <div>
              <p>Total: {severityGroup.total}</p>
              <ul>
                {severityGroup.issues.map((issue) => (
                  <li key={issue.id}>
                    {issue.title} - {issue.state}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

## Notes

- The hook fetches all issues (both ACTIVE and RESOLVED states) - filter by state in your component if needed
- Only the specified severities are fetched (disabled queries for others to optimize performance)
- When `noRefetch=true`, the data is cached with `STALE_TIME` and `refetchOnMount: false`
- The order of results matches the order of severities passed in the array
- Each severity group includes its own loading and error state for granular control
