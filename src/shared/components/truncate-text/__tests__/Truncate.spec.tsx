import { fireEvent, render, screen } from '@testing-library/react';
import { Truncate } from '../Truncate';

const showModalMock = jest.fn();

jest.mock('../../../../components/modal/ModalProvider', () => ({
  useModalLauncher: () => showModalMock,
}));

describe('Truncate', () => {
  const shortContent = 'Hello';
  const exactLengthContent = 'A'.repeat(80); // Exactly 80 characters
  const longContent =
    'This is a very long text that exceeds the default maximum length of 80 characters and should be truncated';

  beforeEach(() => {
    showModalMock.mockClear();
  });

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

  it('should open modal when "more" is clicked', () => {
    render(<Truncate content={longContent} modalTitle="Full Text" />);

    fireEvent.click(screen.getByRole('button', { name: 'more' }));

    expect(showModalMock).toHaveBeenCalledTimes(1);
  });

  it('should use custom maxLength when provided', () => {
    render(<Truncate content="Hello World" maxLength={5} />);
    expect(screen.getByText('Hello...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'more' })).toBeInTheDocument();
  });

  it('should launch modal with custom title when provided', () => {
    render(<Truncate content={longContent} modalTitle="View Details" />);

    fireEvent.click(screen.getByRole('button', { name: 'more' }));

    expect(showModalMock).toHaveBeenCalledTimes(1);
  });

  it('should handle empty string content', () => {
    render(<Truncate content="" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
