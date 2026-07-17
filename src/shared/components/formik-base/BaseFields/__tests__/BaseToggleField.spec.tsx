import { Checkbox } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import { useField } from 'formik';
import BaseToggleField from '../BaseToggleField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

afterEach(jest.resetAllMocks);

describe('BaseToggleField', () => {
  it('renders FormGroup', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: false, error: null }]);
    render(
      <BaseToggleField name="name" label="label" helperText="helperText">
        {(props) => <Checkbox {...props} />}
      </BaseToggleField>,
    );
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('helperText')).toBeInTheDocument();
  });

  it('renders FormGroup with error message if field is invalid', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: true, error: 'formikError' }]);
    render(
      <BaseToggleField name="name" label="label" helperText="helperText">
        {(props) => <Checkbox {...props} />}
      </BaseToggleField>,
    );
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('formikError')).toBeInTheDocument();
  });
});
