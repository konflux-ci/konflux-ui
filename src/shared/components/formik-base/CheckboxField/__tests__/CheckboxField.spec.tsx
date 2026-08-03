import { fireEvent, render, screen } from '@testing-library/react';
import { useField } from 'formik';
import CheckboxField from '../CheckboxField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

afterEach(jest.resetAllMocks);

describe('CheckboxField', () => {
  it('renders a toggleable field', () => {
    useFieldMock.mockReturnValue([{ value: false }, { touched: false, error: null }]);
    render(<CheckboxField name="name" label="label" helperText="helperText" />);
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('helperText')).toBeInTheDocument();
  });

  it('renders error message if field is invalid', () => {
    useFieldMock.mockReturnValue([{ value: undefined }, { touched: true, error: 'formikError' }]);
    render(<CheckboxField name="name" label="label" helperText="helperText" />);
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('formikError')).toBeInTheDocument();
  });

  it('fires callback on toggle', () => {
    const onChange = jest.fn();
    useFieldMock.mockReturnValue([
      { value: false, onChange },
      { touched: false, error: null },
    ]);
    render(<CheckboxField name="name" label="label" helperText="helperText" />);
    fireEvent.click(screen.getByText('label'));
    expect(onChange).toHaveBeenCalled();
  });
});
