import { fireEvent, render, screen } from '@testing-library/react';
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
    // Should show first 80 characters followed by "...more" button
    expect(screen.getByText(`${longContent.slice(0, 80)}...`)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('should open modal with full text when "more" is clicked', () => {
    render(<Truncate content={longContent} modalTitle="Full Text" />);

    // Click the "...more" button
    fireEvent.click(screen.getByRole('button', { name: 'more' }));

    // Modal should be open with full text
    expect(screen.getByText(longContent)).toBeInTheDocument();
  });

  it('should use custom maxLength when provided', () => {
    render(<Truncate content="Hello World" maxLength={5} />);
    expect(screen.getByText('Hello...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('should use custom modal title when provided', () => {
    render(<Truncate content={longContent} modalTitle="View Details" />);

    fireEvent.click(screen.getByRole('button', { name: 'more' }));

    expect(screen.getByText('View Details')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', () => {
    render(<Truncate content={longContent} />);

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: 'more' }));
    expect(screen.getByText(longContent)).toBeInTheDocument();

    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    // Modal content should not be visible (only truncated text remains)
    expect(screen.getByText(`${longContent.slice(0, 80)}...`)).toBeInTheDocument();
  });

  it('should handle empty string content', () => {
    render(<Truncate content="" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
