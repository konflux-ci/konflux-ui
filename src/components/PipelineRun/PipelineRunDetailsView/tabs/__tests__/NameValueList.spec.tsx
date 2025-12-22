import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import NameValueList from '../NameValueList';

describe('NameValueList', () => {
  const mockItems = [
    { name: 'param1', value: 'value1' },
    { name: 'param2', value: 'value2' },
    { name: 'param3', value: 'https://example.com' },
  ];

  const defaultProps = {
    items: mockItems,
    descriptionListTestId: 'test-name-value-list',
    title: 'Test Title',
    status: null,
  };

  describe('Basic Rendering', () => {
    it('should render the component with correct structure', () => {
      render(<NameValueList {...defaultProps} />);

      expect(screen.getByTestId('test-name-value-list')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      render(<NameValueList {...defaultProps} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });

    it('should render all items in the table', () => {
      render(<NameValueList {...defaultProps} />);

      expect(screen.getByText('param1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
      expect(screen.getByText('param2')).toBeInTheDocument();
      expect(screen.getByText('value2')).toBeInTheDocument();
      expect(screen.getByText('param3')).toBeInTheDocument();
    });

    it('should render table with correct aria-label', () => {
      render(<NameValueList {...defaultProps} />);

      const table = screen.getByRole('grid');
      expect(table).toHaveAttribute('aria-label', 'results');
    });
  });

  describe('Empty Items Array', () => {
    it('should render table structure even with empty items array', () => {
      render(<NameValueList {...defaultProps} items={[]} />);

      expect(screen.getByTestId('test-name-value-list')).toBeInTheDocument();
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });

  describe('Status Handling', () => {
    it('should render table when status is not "Failed"', () => {
      render(<NameValueList {...defaultProps} status="Succeeded" />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByText('param1')).toBeInTheDocument();
    });

    it('should render table when status is null', () => {
      render(<NameValueList {...defaultProps} status={null} />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByText('param1')).toBeInTheDocument();
    });

    it('should render empty state when status is "Failed"', () => {
      render(<NameValueList {...defaultProps} status="Failed" />);

      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(screen.getByText('No results available due to failure')).toBeInTheDocument();
    });

    it('should render custom empty status message when provided', () => {
      const customMessage = 'Custom failure message';
      render(
        <NameValueList {...defaultProps} status="Failed" emptyStatusMessage={customMessage} />,
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByText('No results available due to failure')).not.toBeInTheDocument();
    });
  });

  describe('Compressed Mode', () => {
    it('should apply compressed class when compressed prop is true', () => {
      const { container } = render(<NameValueList {...defaultProps} compressed />);

      const descriptionList = container.querySelector('.name-value-list.m-compressed');
      expect(descriptionList).toBeInTheDocument();
    });

    it('should not apply compressed class when compressed prop is false', () => {
      const { container } = render(<NameValueList {...defaultProps} compressed={false} />);

      const descriptionList = container.querySelector('.name-value-list.m-compressed');
      expect(descriptionList).not.toBeInTheDocument();
    });

    it('should not apply compressed class when compressed prop is undefined', () => {
      const { container } = render(<NameValueList {...defaultProps} />);

      const descriptionList = container.querySelector('.name-value-list.m-compressed');
      expect(descriptionList).not.toBeInTheDocument();
    });
  });

  describe('Custom Props', () => {
    it('should render with custom title', () => {
      render(<NameValueList {...defaultProps} title="Custom Title" />);

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render with custom descriptionListTestId', () => {
      render(<NameValueList {...defaultProps} descriptionListTestId="custom-test-id" />);

      expect(screen.getByTestId('custom-test-id')).toBeInTheDocument();
    });
  });

  describe('URL Handling', () => {
    it('should render URLs as links when handleURLs processes them', () => {
      render(<NameValueList {...defaultProps} />);

      const link = screen.getByRole('link', { name: 'https://example.com' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });

    it('should render non-URL values as plain text', () => {
      render(<NameValueList {...defaultProps} />);

      expect(screen.getByText('value1')).toBeInTheDocument();
      expect(screen.getByText('value2')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle items with empty string values', () => {
      const itemsWithEmptyValue = [{ name: 'empty', value: '' }];
      render(<NameValueList {...defaultProps} items={itemsWithEmptyValue} />);

      expect(screen.getByText('empty')).toBeInTheDocument();
    });

    it('should handle items with very long values', () => {
      const longValue = 'a'.repeat(1000);
      const itemsWithLongValue = [{ name: 'long', value: longValue }];
      render(<NameValueList {...defaultProps} items={itemsWithLongValue} />);

      expect(screen.getByText('long')).toBeInTheDocument();
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('should handle special characters in names and values', () => {
      const specialItems = [
        { name: 'param-with-dashes', value: 'value with spaces' },
        { name: 'param_with_underscores', value: 'value-with-dashes' },
        { name: 'param.with.dots', value: 'value/with/slashes' },
      ];
      render(<NameValueList {...defaultProps} items={specialItems} />);

      expect(screen.getByText('param-with-dashes')).toBeInTheDocument();
      expect(screen.getByText('value with spaces')).toBeInTheDocument();
      expect(screen.getByText('param_with_underscores')).toBeInTheDocument();
      expect(screen.getByText('value-with-dashes')).toBeInTheDocument();
      expect(screen.getByText('param.with.dots')).toBeInTheDocument();
      expect(screen.getByText('value/with/slashes')).toBeInTheDocument();
    });
  });
});
