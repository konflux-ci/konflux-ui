import { render, screen } from '@testing-library/react';
import { useField } from 'formik';
import TextAreaField from '../TextAreaField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

afterEach(jest.resetAllMocks);

describe('TextAreaField', () => {
  it('renders with label and helper text', () => {
    useFieldMock.mockReturnValue([
      { value: '', onChange: jest.fn() },
      { touched: false, error: null },
    ]);
    render(<TextAreaField name="test" label="Description" helperText="Help" />);
    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders error when touched and invalid', () => {
    useFieldMock.mockReturnValue([
      { value: '', onChange: jest.fn() },
      { touched: true, error: 'Too short' },
    ]);
    render(<TextAreaField name="test" label="Description" />);
    expect(screen.getByText('Too short')).toBeInTheDocument();
  });
});
