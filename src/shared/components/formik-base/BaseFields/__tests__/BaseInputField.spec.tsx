import '@testing-library/jest-dom';
import { TextInput, ValidatedOptions } from '@patternfly/react-core';
import { render, screen } from '@testing-library/react';
import { useField } from 'formik';
import BaseInputField from '../BaseInputField';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

describe('BaseInputField', () => {
  afterEach(jest.resetAllMocks);

  it('renders FormGroup', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: false, error: null }]);
    render(
      <BaseInputField name="name" label="label" helperText="helperText">
        {(props) => <TextInput {...props} />}
      </BaseInputField>,
    );
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('helperText')).toBeInTheDocument();
  });

  it('renders FormGroup with error message if field is invalid and helperTextInvalid is not provided', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: true, error: 'formikError' }]);
    render(
      <BaseInputField name="name" label="label" helperText="helperText">
        {(props) => <TextInput {...props} />}
      </BaseInputField>,
    );
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('formikError')).toBeInTheDocument();
  });

  it('renders FormGroup with helperTextInvalid if field is invalid but formik error is null and helperTextInvalid is provided', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: true, error: null }]);
    render(
      <BaseInputField
        name="name"
        label="label"
        helperText="helperText"
        helperTextInvalid="helperTextInvalid"
        validated={ValidatedOptions.error}
      >
        {(props) => <TextInput {...props} />}
      </BaseInputField>,
    );
    expect(screen.getByText('label')).toBeInTheDocument();
    expect(screen.getByText('helperTextInvalid')).toBeInTheDocument();
  });
});
