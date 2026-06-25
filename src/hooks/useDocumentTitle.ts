import * as React from 'react';

/**
 * This hook allows you to dynamically update the title of a webpage based on a specified `title` string.
 * @param {string} title Title to update
 */
export const useDocumentTitle = (title: string): void => {
  React.useEffect(() => {
    document.title = title;
    return () => {
      document.title = 'Konflux';
    };
  }, [title]);
};
