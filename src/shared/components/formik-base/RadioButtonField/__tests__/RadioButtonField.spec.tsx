import { fireEvent, render, screen } from '@testing-library/react';
import { useField, useFormikContext } from 'formik';
import RadioButtonField from '../RadioButtonField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
  useFormikContext: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;
const useFormikContextMock = useFormikContext as jest.Mock;

afterEach(jest.resetAllMocks);

describe('RadioButtonField', () => {
  const mockFormik = {
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  };

  beforeEach(() => {
    useFormikContextMock.mockReturnValue(mockFormik);
  });

  it('renders a radio button with label', () => {
    useFieldMock.mockReturnValue([{ value: 'a' }, { touched: false, error: null }]);
    render(<RadioButtonField name="choice" label="Option A" value="a" />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
  });

  it('is checked when field value matches', () => {
    useFieldMock.mockReturnValue([{ value: 'a' }, { touched: false, error: null }]);
    render(<RadioButtonField name="choice" label="Option A" value="a" />);
    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('is not checked when field value differs', () => {
    useFieldMock.mockReturnValue([{ value: 'b' }, { touched: false, error: null }]);
    render(<RadioButtonField name="choice" label="Option A" value="a" />);
    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('calls setFieldValue on change', () => {
    useFieldMock.mockReturnValue([{ value: 'b' }, { touched: false, error: null }]);
    render(<RadioButtonField name="choice" label="Option A" value="a" />);
    fireEvent.click(screen.getByText('Option A'));
    expect(mockFormik.setFieldValue).toHaveBeenCalledWith('choice', 'a');
    expect(mockFormik.setFieldTouched).toHaveBeenCalledWith('choice', true, false);
  });

  it('calls custom onChange when provided', () => {
    const onChange = jest.fn();
    useFieldMock.mockReturnValue([{ value: 'b' }, { touched: false, error: null }]);
    render(<RadioButtonField name="choice" label="Option A" value="a" onChange={onChange} />);
    fireEvent.click(screen.getByText('Option A'));
    expect(onChange).toHaveBeenCalledWith('a');
    expect(mockFormik.setFieldValue).not.toHaveBeenCalled();
  });
});
