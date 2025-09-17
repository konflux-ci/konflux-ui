import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormikProvider, useFormik } from 'formik';
import { SecretLinkOptionLabels } from '~/consts/secrets';
import { SecretLinkOptions } from '../SecretsForm/SecretLinkOption';
import { SecretForComponentOption } from '../utils/secret-utils';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const formikBag = useFormik({
    initialValues: { components: [] },
    onSubmit: () => {},
  });

  return <FormikProvider value={formikBag}>{children}</FormikProvider>;
};

describe('SecretLinkOptions', () => {
  const mockOnOptionChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the radio group with correct options for adding secret page', () => {
    render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
          radioLabels={SecretLinkOptionLabels.default}
        />
      </TestWrapper>,
    );

    expect(screen.getByText('Link secret options')).toBeInTheDocument();
    expect(screen.getByLabelText(SecretLinkOptionLabels.default.none)).toBeInTheDocument();
    expect(screen.getByLabelText(SecretLinkOptionLabels.default.all)).toBeInTheDocument();
    expect(screen.getByLabelText(SecretLinkOptionLabels.default.partial)).toBeInTheDocument();
  });

  it('renders the radio group with correct options for importing secret page', () => {
    render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
          radioLabels={SecretLinkOptionLabels.forImportSecret}
        />
      </TestWrapper>,
    );

    expect(screen.getByText('Link secret options')).toBeInTheDocument();
    expect(screen.queryByText(SecretLinkOptionLabels.default.none)).toBeNull();
    expect(screen.getByLabelText(SecretLinkOptionLabels.forImportSecret.all)).toBeInTheDocument();
    expect(screen.getByLabelText(SecretLinkOptionLabels.forImportSecret.all)).toBeInTheDocument();
  });

  it('calls onOptionChange when a radio button is selected', () => {
    render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
          radioLabels={SecretLinkOptionLabels.forImportSecret}
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByLabelText('Select components in the namespace'));
    expect(mockOnOptionChange).toHaveBeenCalledWith(SecretForComponentOption.partial);
  });

  it('calls onOptionChange with when option is selected', () => {
    render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
          radioLabels={SecretLinkOptionLabels.default}
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByLabelText(SecretLinkOptionLabels.default.all));
    expect(mockOnOptionChange).toHaveBeenCalledWith(SecretForComponentOption.all);
  });

  it('conditionally renders the ComponentSelector when "partial" option is selected', () => {
    const queryClient = new QueryClient();
    const { rerender } = render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
          radioLabels={SecretLinkOptionLabels.default}
        />
      </TestWrapper>,
    );

    expect(screen.queryByTestId('component-select-menu')).not.toBeInTheDocument();
    rerender(
      <TestWrapper>
        <QueryClientProvider client={queryClient}>
          <SecretLinkOptions
            secretForComponentOption={SecretForComponentOption.partial}
            onOptionChange={mockOnOptionChange}
            radioLabels={SecretLinkOptionLabels.forImportSecret}
          />
        </QueryClientProvider>
      </TestWrapper>,
    );
    expect(screen.getByTestId('component-select-menu')).toBeInTheDocument();
  });
});
