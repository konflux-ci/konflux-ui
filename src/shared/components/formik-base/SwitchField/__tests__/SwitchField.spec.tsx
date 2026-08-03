import { render, screen } from '@testing-library/react';
import { useField } from 'formik';
import SwitchField from '../SwitchField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

afterEach(jest.resetAllMocks);

describe('SwitchField', () => {
  it('renders a toggleable field', () => {
    useFieldMock.mockReturnValue([{ value: false }, { touched: false, error: null }]);
    render(<SwitchField name="test" label="Toggle" helperText="Help" />);
    expect(screen.getByText('Toggle')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders error when touched and invalid', () => {
    useFieldMock.mockReturnValue([{ value: false }, { touched: true, error: 'Required' }]);
    render(<SwitchField name="test" label="Toggle" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});
