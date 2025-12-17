import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { PipelineRunParam, PipelineTaskParam } from '../../../../../types';
import RunParamsList from '../RunParamsList';

describe('RunParamsList', () => {
  describe('Basic Rendering', () => {
    it('should render the component with PipelineRunParam params', () => {
      const params: PipelineRunParam[] = [
        { name: 'param1', value: 'value1' },
        { name: 'param2', value: 'value2' },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByTestId('run-params-list')).toBeInTheDocument();
      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('param1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
      expect(screen.getByText('param2')).toBeInTheDocument();
      expect(screen.getByText('value2')).toBeInTheDocument();
    });

    it('should render the component with PipelineTaskParam params', () => {
      const params: PipelineTaskParam[] = [
        { name: 'taskParam1', value: 'taskValue1' },
        { name: 'taskParam2', value: 123 },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByTestId('run-params-list')).toBeInTheDocument();
      expect(screen.getByText('Parameters')).toBeInTheDocument();
      expect(screen.getByText('taskParam1')).toBeInTheDocument();
      expect(screen.getByText('taskValue1')).toBeInTheDocument();
      expect(screen.getByText('taskParam2')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
    });

    it('should render the component with mixed param types', () => {
      const params: (PipelineRunParam | PipelineTaskParam)[] = [
        { name: 'runParam', value: 'runValue' },
        { name: 'taskParam', value: 456 },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByTestId('run-params-list')).toBeInTheDocument();
      expect(screen.getByText('runParam')).toBeInTheDocument();
      expect(screen.getByText('runValue')).toBeInTheDocument();
      expect(screen.getByText('taskParam')).toBeInTheDocument();
      expect(screen.getByText('456')).toBeInTheDocument();
    });

    it('should render table headers', () => {
      const params: PipelineRunParam[] = [{ name: 'param1', value: 'value1' }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Value')).toBeInTheDocument();
    });
  });

  describe('Value Normalization', () => {
    it('should normalize string values', () => {
      const params: PipelineTaskParam[] = [{ name: 'strParam', value: 'string value' }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('string value')).toBeInTheDocument();
    });

    it('should normalize array values (PipelineRunParam)', () => {
      const params: PipelineRunParam[] = [
        { name: 'arrayParam', value: ['value1', 'value2', 'value3'] },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('value1, value2, value3')).toBeInTheDocument();
    });

    it('should normalize array values (PipelineTaskParam)', () => {
      const params: PipelineTaskParam[] = [{ name: 'arrayParam', value: ['a', 'b', 'c'] }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('a, b, c')).toBeInTheDocument();
    });

    it('should normalize object values to JSON string', () => {
      const params: PipelineTaskParam[] = [
        { name: 'objParam', value: { key: 'value', nested: { prop: 123 } } },
      ];

      render(<RunParamsList params={params} />);

      const expectedJson = JSON.stringify({ key: 'value', nested: { prop: 123 } });
      expect(screen.getByText(expectedJson)).toBeInTheDocument();
    });

    it('should normalize null values to empty string', () => {
      const params: PipelineTaskParam[] = [{ name: 'nullParam', value: null }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('nullParam')).toBeInTheDocument();
      const valueCell = screen.getByText('nullParam').closest('tr')?.querySelector('td:last-child');
      expect(valueCell?.textContent).toBe('');
    });

    it('should normalize undefined values to empty string', () => {
      const params: PipelineTaskParam[] = [{ name: 'undefinedParam', value: undefined }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('undefinedParam')).toBeInTheDocument();
      const valueCell = screen
        .getByText('undefinedParam')
        .closest('tr')
        ?.querySelector('td:last-child');
      expect(valueCell?.textContent).toBe('');
    });

    it('should normalize number values', () => {
      const params: PipelineTaskParam[] = [
        { name: 'numParam', value: 42 },
        { name: 'floatParam', value: 3.14 },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('42')).toBeInTheDocument();
      expect(screen.getByText('3.14')).toBeInTheDocument();
    });

    it('should normalize boolean values', () => {
      const params: PipelineTaskParam[] = [
        { name: 'trueParam', value: true },
        { name: 'falseParam', value: false },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('true')).toBeInTheDocument();
      expect(screen.getByText('false')).toBeInTheDocument();
    });

    it('should normalize empty array to empty string', () => {
      const params: PipelineRunParam[] = [{ name: 'emptyArray', value: [] }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('emptyArray')).toBeInTheDocument();
      const valueCell = screen
        .getByText('emptyArray')
        .closest('tr')
        ?.querySelector('td:last-child');
      expect(valueCell?.textContent).toBe('');
    });

    it('should normalize array with mixed types', () => {
      const params: PipelineTaskParam[] = [
        { name: 'mixedArray', value: ['string', 123, true, null] },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('string, 123, true, null')).toBeInTheDocument();
    });
  });

  describe('Compressed Mode', () => {
    it('should pass compressed prop to NameValueList', () => {
      const params: PipelineRunParam[] = [{ name: 'param1', value: 'value1' }];

      const { container } = render(<RunParamsList params={params} compressed />);

      const descriptionList = container.querySelector('.name-value-list.m-compressed');
      expect(descriptionList).toBeInTheDocument();
    });

    it('should not apply compressed class when compressed is false', () => {
      const params: PipelineRunParam[] = [{ name: 'param1', value: 'value1' }];

      const { container } = render(<RunParamsList params={params} compressed={false} />);

      const descriptionList = container.querySelector('.name-value-list.m-compressed');
      expect(descriptionList).not.toBeInTheDocument();
    });

    it('should not apply compressed class when compressed is undefined', () => {
      const params: PipelineRunParam[] = [{ name: 'param1', value: 'value1' }];

      const { container } = render(<RunParamsList params={params} />);

      const descriptionList = container.querySelector('.name-value-list.m-compressed');
      expect(descriptionList).not.toBeInTheDocument();
    });
  });

  describe('Multiple Params', () => {
    it('should render multiple params correctly', () => {
      const params: (PipelineRunParam | PipelineTaskParam)[] = [
        { name: 'param1', value: 'value1' },
        { name: 'param2', value: ['array', 'values'] },
        { name: 'param3', value: { key: 'value' } },
        { name: 'param4', value: 123 },
        { name: 'param5', value: true },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('param1')).toBeInTheDocument();
      expect(screen.getByText('value1')).toBeInTheDocument();
      expect(screen.getByText('param2')).toBeInTheDocument();
      expect(screen.getByText('array, values')).toBeInTheDocument();
      expect(screen.getByText('param3')).toBeInTheDocument();
      expect(screen.getByText(JSON.stringify({ key: 'value' }))).toBeInTheDocument();
      expect(screen.getByText('param4')).toBeInTheDocument();
      expect(screen.getByText('123')).toBeInTheDocument();
      expect(screen.getByText('param5')).toBeInTheDocument();
      expect(screen.getByText('true')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle params with special characters in names', () => {
      const params: PipelineRunParam[] = [
        { name: 'param-with-dashes', value: 'value1' },
        { name: 'param_with_underscores', value: 'value2' },
        { name: 'param.with.dots', value: 'value3' },
      ];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('param-with-dashes')).toBeInTheDocument();
      expect(screen.getByText('param_with_underscores')).toBeInTheDocument();
      expect(screen.getByText('param.with.dots')).toBeInTheDocument();
    });

    it('should handle params with very long values', () => {
      const longValue = 'a'.repeat(1000);
      const params: PipelineRunParam[] = [{ name: 'longParam', value: longValue }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('longParam')).toBeInTheDocument();
      expect(screen.getByText(longValue)).toBeInTheDocument();
    });

    it('should handle params with URLs in values', () => {
      const params: PipelineRunParam[] = [{ name: 'urlParam', value: 'https://example.com' }];

      render(<RunParamsList params={params} />);

      expect(screen.getByText('urlParam')).toBeInTheDocument();
      const link = screen.getByRole('link', { name: 'https://example.com' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', 'https://example.com');
    });
  });
});
