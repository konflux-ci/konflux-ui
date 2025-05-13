import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormikProvider, useFormik } from 'formik';
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

  it('renders the radio group with correct options', () => {
    render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
        />
      </TestWrapper>,
    );

    expect(screen.getByText('Link secret options')).toBeInTheDocument();
    expect(
      screen.getByLabelText('All existing and future components in the namespace'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Select components in the namespace')).toBeInTheDocument();
  });

  it('calls onOptionChange when a radio button is selected', () => {
    render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
        />
      </TestWrapper>,
    );

    fireEvent.click(screen.getByLabelText('Select components in the namespace'));
    expect(mockOnOptionChange).toHaveBeenCalledWith(SecretForComponentOption.partial);
  });

  it('conditionally renders the ComponentSelector when "partial" option is selected', () => {
    const queryClient = new QueryClient();
    const { rerender } = render(
      <TestWrapper>
        <SecretLinkOptions
          secretForComponentOption={SecretForComponentOption.all}
          onOptionChange={mockOnOptionChange}
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
          />
        </QueryClientProvider>
      </TestWrapper>,
    );
    expect(screen.getByTestId('component-select-menu')).toBeInTheDocument();
  });
});
