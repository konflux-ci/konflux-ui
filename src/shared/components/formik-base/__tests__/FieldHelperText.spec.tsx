import { render, screen } from '@testing-library/react';
import FieldHelperText from '../FieldHelperText';
import '@testing-library/jest-dom';

describe('FieldHelperText', () => {
  it('renders nothing when valid and no help text', () => {
    const { container } = render(<FieldHelperText isValid />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders help text when valid', () => {
    render(<FieldHelperText isValid helpText="Some help" />);
    expect(screen.getByText('Some help')).toBeInTheDocument();
  });

  it('renders error message when invalid', () => {
    render(<FieldHelperText isValid={false} errorMessage="Something wrong" />);
    expect(screen.getByText('Something wrong')).toBeInTheDocument();
  });

  it('renders error over help text when invalid', () => {
    render(<FieldHelperText isValid={false} errorMessage="Something wrong" helpText="Some help" />);
    expect(screen.getByText('Something wrong')).toBeInTheDocument();
    expect(screen.queryByText('Some help')).not.toBeInTheDocument();
  });
});
