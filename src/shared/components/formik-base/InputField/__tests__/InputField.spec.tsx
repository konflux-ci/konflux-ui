import { render, screen } from '@testing-library/react';
import { useField } from 'formik';
import InputField from '../InputField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

afterEach(jest.resetAllMocks);

describe('InputField', () => {
  it('renders with label and helper text', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: false, error: null }]);
    render(<InputField name="test" label="Test Label" helperText="Help" />);
    expect(screen.getByText('Test Label')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders error when touched and invalid', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: true, error: 'Required' }]);
    render(<InputField name="test" label="Test Label" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
