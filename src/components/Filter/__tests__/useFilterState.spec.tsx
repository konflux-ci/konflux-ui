import { render, screen, act } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useFilterState } from '~/components/Filter/hooks/useFilterState';
import { defineFilters } from '~/components/Filter/types';

const testConfigs = defineFilters<{ metadata: { name: string }; status: string }>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    placeholder: 'Filter by name...',
  },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, values) => values.includes(item.status),
  },
  {
    type: 'boolean',
    param: 'showArchived',
    label: 'Show Archived',
  },
] as const);

const apiConfigs = defineFilters<{ metadata: { name: string }; status: string }>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    mode: 'api',
  },
  {
    type: 'multiSelect',
    param: 'status',
    label: 'Status',
    filterFn: (item, values) => values.includes(item.status),
  },
] as const);

const TestDisplay = ({ configs }: { configs: typeof testConfigs }) => {
  const { filterValues, clientFilterValues, isFiltered, clearAll } = useFilterState(configs);
  return (
    <div>
      <span data-test="name">{filterValues.name}</span>
      <span data-test="status">{JSON.stringify(filterValues.status)}</span>
      <span data-test="showArchived">{String(filterValues.showArchived)}</span>
      <span data-test="isFiltered">{String(isFiltered)}</span>
      <span data-test="clientKeys">{Object.keys(clientFilterValues).sort().join(',')}</span>
      <button data-test="clear" onClick={clearAll}>
        Clear
      </button>
    </div>
  );
};

describe('useFilterState', () => {
  it('returns default values when no URL params set', () => {
    render(
      <NuqsTestingAdapter>
        <TestDisplay configs={testConfigs} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('name')).toHaveTextContent('');
    expect(screen.getByTestId('status')).toHaveTextContent('[]');
    expect(screen.getByTestId('showArchived')).toHaveTextContent('false');
  });

  it('reads values from URL params', () => {
    render(
      <NuqsTestingAdapter searchParams="?name=foo&status=%5B%22active%22%5D&showArchived=true">
        <TestDisplay configs={testConfigs} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('name')).toHaveTextContent('foo');
    expect(screen.getByTestId('status')).toHaveTextContent('["active"]');
    expect(screen.getByTestId('showArchived')).toHaveTextContent('true');
  });

  it('isFiltered is false when all values are defaults', () => {
    render(
      <NuqsTestingAdapter>
        <TestDisplay configs={testConfigs} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('isFiltered')).toHaveTextContent('false');
  });

  it('isFiltered is true when any value is non-default', () => {
    render(
      <NuqsTestingAdapter searchParams="?name=test">
        <TestDisplay configs={testConfigs} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('isFiltered')).toHaveTextContent('true');
  });

  it('clearAll removes all managed params from URL', () => {
    render(
      <NuqsTestingAdapter searchParams="?name=test&status=%5B%22done%22%5D&showArchived=true">
        <TestDisplay configs={testConfigs} />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByTestId('isFiltered')).toHaveTextContent('true');

    act(() => {
      screen.getByTestId('clear').click();
    });

    expect(screen.getByTestId('name')).toHaveTextContent('');
    expect(screen.getByTestId('status')).toHaveTextContent('[]');
    expect(screen.getByTestId('showArchived')).toHaveTextContent('false');
    expect(screen.getByTestId('isFiltered')).toHaveTextContent('false');
  });

  it('clientFilterValues excludes api-mode params', () => {
    const ApiTestDisplay = () => {
      const { clientFilterValues } = useFilterState(apiConfigs);
      return (
        <div>
          <span data-test="clientKeys">{Object.keys(clientFilterValues).sort().join(',')}</span>
        </div>
      );
    };

    render(
      <NuqsTestingAdapter>
        <ApiTestDisplay />
      </NuqsTestingAdapter>,
    );
    // 'name' is api mode, so excluded. Only 'status' should be in clientFilterValues.
    expect(screen.getByTestId('clientKeys')).toHaveTextContent('status');
  });

  it('clientFilterValues excludes boolean params', () => {
    render(
      <NuqsTestingAdapter>
        <TestDisplay configs={testConfigs} />
      </NuqsTestingAdapter>,
    );
    // 'showArchived' is boolean, so excluded. Only 'name' and 'status' should remain.
    expect(screen.getByTestId('clientKeys')).toHaveTextContent('name,status');
  });
});
