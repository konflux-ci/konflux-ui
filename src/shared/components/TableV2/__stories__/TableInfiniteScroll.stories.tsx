import React, { useState, useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { expect, within } from 'storybook/test';
import { Table } from '~/shared/components/TableV2';
import { generateMockData, columns, getRowId } from './storyData';

const meta: Meta = {
  title: 'TableV2/InfiniteScroll',
  decorators: [
    (Story) => (
      <div style={{ height: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;

const InfiniteScrollDemo = () => {
  const [pages, setPages] = useState(1);
  const pageSize = 20;
  const maxPages = 5;

  const data = generateMockData(pages * pageSize);
  const hasNextPage = pages < maxPages;
  const [isFetching, setIsFetching] = useState(false);

  const fetchNextPage = useCallback(() => {
    setIsFetching(true);
    // Simulate async fetch
    setTimeout(() => {
      setPages((p) => Math.min(p + 1, maxPages));
      setIsFetching(false);
    }, 500);
  }, []);

  return (
    <div data-test="infinite-scroll-wrapper">
      <div style={{ padding: '8px 0', fontSize: '12px' }}>
        Loaded: {data.length} rows (page {pages}/{maxPages})
      </div>
      <div style={{ height: 'calc(100% - 30px)' }}>
        <Table
          data={data}
          columns={columns}
          getRowId={getRowId}
          aria-label="Infinite scroll demo"
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetching}
          fetchNextPage={fetchNextPage}
        />
      </div>
    </div>
  );
};

export const InfiniteScroll: StoryObj = {
  render: () => <InfiniteScrollDemo />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders with initial data
    await expect(canvas.getByRole('grid')).toBeInTheDocument();

    // Data rows visible
    const rows = canvasElement.querySelectorAll('[data-test="table-row"]');
    await expect(rows.length).toBeGreaterThan(0);

    // Shows page info
    await expect(canvas.getByText(/Loaded: 20 rows/)).toBeInTheDocument();
  },
};

const FetchingMoreDemo = () => (
  <Table
    data={generateMockData(20)}
    columns={columns}
    getRowId={getRowId}
    aria-label="Fetching more demo"
    hasNextPage={true}
    isFetchingNextPage={true}
    fetchNextPage={() => undefined}
  />
);

export const FetchingIndicator: StoryObj = {
  render: () => <FetchingMoreDemo />,
  decorators: [
    (Story) => (
      <div style={{ height: '600px' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Table renders
    await expect(canvas.getByRole('grid')).toBeInTheDocument();

    // The skeleton loading rows are in the DOM
    // (They may or may not be visible depending on scroll position,
    // but they should exist in the table body)
    const loadingRows = canvasElement.querySelectorAll('[data-test="table-loading-more"]');
    await expect(loadingRows.length).toBeGreaterThan(0);
  },
};
