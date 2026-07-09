import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Truncate } from '../Truncate';

describe('Truncate', () => {
  const shortContent = 'Hello';
  const exactLengthContent = 'A'.repeat(80); // Exactly 80 characters
  const longContent =
    'This is a very long text that exceeds the default maximum length of 80 characters and should be truncated';

  it('should render full text when content is shorter than 80 characters', () => {
    render(<Truncate content={shortContent} />);
    expect(screen.getByText(shortContent)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should render full text when content is exactly 80 characters', () => {
    render(<Truncate content={exactLengthContent} />);
    expect(screen.getByText(exactLengthContent)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should truncate text when content is longer than 80 characters', () => {
    render(<Truncate content={longContent} />);
    expect(screen.getByText(`${longContent.slice(0, 80)}...`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('should open modal with full text when "more" is clicked', async () => {
    const user = userEvent.setup();
    render(<Truncate content={longContent} modalTitle="Full Text" />);

    await user.click(screen.getByRole('button', { name: 'more' }));

    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it('should use custom maxLength when provided', () => {
    render(<Truncate content="Hello World" maxLength={5} />);
    expect(screen.getByText('Hello...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('should use custom modal title when provided', async () => {
    const user = userEvent.setup();
    render(<Truncate content={longContent} modalTitle="View Details" />);

    await user.click(screen.getByRole('button', { name: 'more' }));

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<Truncate content={longContent} />);

    await user.click(screen.getByRole('button', { name: 'more' }));
    expect(screen.getByText(longContent)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.getByText(`${longContent.slice(0, 80)}...`)).toBeInTheDocument();
  });

  it('should handle empty string content', () => {
    render(<Truncate content="" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('Truncate (expandInline mode)', () => {
  const shortContent = 'Hello';
  const longContent =
    'This is a very long text that exceeds the default maximum length of 80 characters and should be truncated';

  it('renders full text with no button when content is short', () => {
    render(<Truncate content={shortContent} expandInline />);
    expect(screen.getByText(shortContent)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders full text with no button when content is exactly maxLength characters', () => {
    const exactContent = 'A'.repeat(80);
    render(<Truncate content={exactContent} expandInline />);
    expect(screen.getByText(exactContent)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders truncated text and "more" button when content exceeds maxLength', () => {
    render(<Truncate content={longContent} expandInline />);
    expect(screen.getByText(`${longContent.slice(0, 80)}...`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('reveals full text and switches button to "less" when "more" is clicked', async () => {
    const user = userEvent.setup();
    render(<Truncate content={longContent} expandInline />);

    await user.click(screen.getByRole('button', { name: 'more' }));

    expect(screen.getByText(longContent)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'less' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'more' })).not.toBeInTheDocument();
  });

  it('re-collapses to truncated text when "less" is clicked', async () => {
    const user = userEvent.setup();
    render(<Truncate content={longContent} expandInline />);

    await user.click(screen.getByRole('button', { name: 'more' }));
    await user.click(screen.getByRole('button', { name: 'less' }));

    expect(screen.getByText(`${longContent.slice(0, 80)}...`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('respects a custom maxLength', () => {
    render(<Truncate content="Hello World" maxLength={5} expandInline />);
    expect(screen.getByText('Hello...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('renders no button for empty string', () => {
    render(<Truncate content="" expandInline />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('does not open a modal in expandInline mode', async () => {
    const user = userEvent.setup();
    render(<Truncate content={longContent} expandInline />);

    await user.click(screen.getByRole('button', { name: 'more' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
