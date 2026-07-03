import { render, screen } from '@testing-library/react';
import { useField } from 'formik';
import FileUploadField from '../FileUploadField';
import '@testing-library/jest-dom';

jest.mock('formik', () => ({
  useField: jest.fn(),
}));

const useFieldMock = useField as jest.Mock;

afterEach(jest.resetAllMocks);

describe('FileUploadField', () => {
  it('renders with label and helper text', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: false, error: null }]);
    render(<FileUploadField name="file" label="Upload" helperText="Help" id="file-upload" />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('renders error when touched and invalid', () => {
    useFieldMock.mockReturnValue([{ value: '' }, { touched: true, error: 'File required' }]);
    render(<FileUploadField name="file" label="Upload" id="file-upload" />);
    expect(screen.getByText('File required')).toBeInTheDocument();
  });
});
