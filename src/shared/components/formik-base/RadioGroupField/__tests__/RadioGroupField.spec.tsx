import { render, screen } from '@testing-library/react';
import { useField, useFormikContext } from 'formik';
import RadioGroupField from '../RadioGroupField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
  useFormikContext: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;
const useFormikContextMock = useFormikContext as jest.Mock;

afterEach(jest.resetAllMocks);

describe('RadioGroupField', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  beforeEach(() => {
    useFormikContextMock.mockReturnValue({
      setFieldValue: jest.fn(),
      setFieldTouched: jest.fn(),
    });
  });

  it('renders all options with label', () => {
    useFieldMock.mockReturnValue([{ value: 'a' }, { touched: false, error: null }]);
    render(<RadioGroupField name="choice" label="Pick one" options={options} />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders error when touched and invalid', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: true, error: 'Required' }]);
    render(<RadioGroupField name="choice" label="Pick one" options={options} />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders helper text', () => {
    useFieldMock.mockReturnValue([{ value: 'a' }, { touched: false, error: null }]);
    render(<RadioGroupField name="choice" label="Pick one" options={options} helperText="Help" />);
    expect(screen.getByText('Help')).toBeInTheDocument();
  });
});
