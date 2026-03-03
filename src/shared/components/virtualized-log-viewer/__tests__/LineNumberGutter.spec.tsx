import type { VirtualItem } from '@tanstack/react-virtual';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LineNumberGutter } from '../LineNumberGutter';

describe('LineNumberGutter', () => {
  const createMockVirtualItem = (index: number, start: number): VirtualItem => ({
    index,
    start,
    end: start + 20,
    size: 20,
    key: `item-${index}`,
    lane: 0,
  });

  const mockVirtualItems: VirtualItem[] = [
    createMockVirtualItem(0, 0),
    createMockVirtualItem(1, 20),
    createMockVirtualItem(2, 40),
  ];

  const defaultProps = {
    virtualItems: mockVirtualItems,
    itemSize: 20,
    onLineClick: jest.fn(),
    isLineHighlighted: jest.fn(() => false),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render gutter container', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} />);
      const gutter = container.querySelector('.log-viewer__gutter');

      expect(gutter).toBeInTheDocument();
    });

    it('should render line numbers for all virtual items', () => {
      render(<LineNumberGutter {...defaultProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should render correct line numbers (1-indexed)', () => {
      const items = [
        createMockVirtualItem(5, 100), // Line 6
        createMockVirtualItem(10, 200), // Line 11
      ];

      render(<LineNumberGutter {...defaultProps} virtualItems={items} />);

      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('should render line numbers as links', () => {
      render(<LineNumberGutter {...defaultProps} />);

      const link = screen.getByText('1').closest('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '#L1');
    });

    it('should add aria-label to line number links', () => {
      render(<LineNumberGutter {...defaultProps} />);

      const link = screen.getByText('1').closest('a');
      expect(link).toHaveAttribute('aria-label', 'Jump to line 1');
    });

    it('should add data-line-number attribute', () => {
      render(<LineNumberGutter {...defaultProps} />);

      const link = screen.getByText('1').closest('a');
      expect(link).toHaveAttribute('data-line-number', '1');
    });
  });

  describe('Styling and Positioning', () => {
    it('should apply correct CSS classes to gutter cells', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} />);
      const cells = container.querySelectorAll('.log-viewer__gutter-cell');

      expect(cells.length).toBe(3);
      cells.forEach((cell) => {
        expect(cell).toHaveClass('log-viewer__gutter-cell');
      });
    });

    it('should apply correct positioning styles', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} itemSize={25} />);
      const firstCell = container.querySelector('.log-viewer__gutter-cell');

      expect(firstCell).toHaveStyle({
        position: 'absolute',
        top: '0',
        left: '0',
        height: '25px',
      });
    });

    it('should apply transform based on virtual item start position', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} />);
      const cells = container.querySelectorAll('.log-viewer__gutter-cell');

      expect(cells[0]).toHaveStyle({ transform: 'translateY(0px)' });
      expect(cells[1]).toHaveStyle({ transform: 'translateY(20px)' });
      expect(cells[2]).toHaveStyle({ transform: 'translateY(40px)' });
    });

    it('should render correct number of gutter cells', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} />);
      const cells = container.querySelectorAll('.log-viewer__gutter-cell');

      // Should render one cell per virtual item
      expect(cells.length).toBe(3);
    });
  });

  describe('Highlighting', () => {
    it('should add highlighted class when line is highlighted', () => {
      const isLineHighlighted = jest.fn((lineNumber: number) => lineNumber === 2);
      const { container } = render(
        <LineNumberGutter {...defaultProps} isLineHighlighted={isLineHighlighted} />,
      );

      const cells = container.querySelectorAll('.log-viewer__gutter-cell');
      expect(cells[0]).not.toHaveClass('log-viewer__gutter-cell--highlighted');
      expect(cells[1]).toHaveClass('log-viewer__gutter-cell--highlighted');
      expect(cells[2]).not.toHaveClass('log-viewer__gutter-cell--highlighted');
    });

    it('should call isLineHighlighted with correct line numbers', () => {
      const isLineHighlighted = jest.fn(() => false);
      render(<LineNumberGutter {...defaultProps} isLineHighlighted={isLineHighlighted} />);

      expect(isLineHighlighted).toHaveBeenCalledWith(1);
      expect(isLineHighlighted).toHaveBeenCalledWith(2);
      expect(isLineHighlighted).toHaveBeenCalledWith(3);
    });

    it('should highlight multiple lines in a range', () => {
      const isLineHighlighted = jest.fn((lineNumber: number) => lineNumber >= 1 && lineNumber <= 3);
      const { container } = render(
        <LineNumberGutter {...defaultProps} isLineHighlighted={isLineHighlighted} />,
      );

      const cells = container.querySelectorAll('.log-viewer__gutter-cell--highlighted');
      expect(cells.length).toBe(3);
    });
  });

  describe('Click Handling', () => {
    it('should call onLineClick when line number is clicked', () => {
      const onLineClick = jest.fn();
      render(<LineNumberGutter {...defaultProps} onLineClick={onLineClick} />);

      const link = screen.getByText('1');
      fireEvent.click(link);

      expect(onLineClick).toHaveBeenCalledWith(1, expect.any(Object));
    });

    it('should prevent default link behavior on click', () => {
      const onLineClick = jest.fn();
      render(<LineNumberGutter {...defaultProps} onLineClick={onLineClick} />);

      const link = screen.getByText('1');
      const event = new MouseEvent('click', { bubbles: true, cancelable: true });
      const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

      link.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should pass mouse event to onLineClick handler', () => {
      const onLineClick = jest.fn();
      render(<LineNumberGutter {...defaultProps} onLineClick={onLineClick} />);

      const link = screen.getByText('2');
      fireEvent.click(link, { shiftKey: true });

      expect(onLineClick).toHaveBeenCalledWith(
        2,
        expect.objectContaining({
          shiftKey: true,
        }),
      );
    });

    it('should handle clicks on different line numbers', () => {
      const onLineClick = jest.fn();
      render(<LineNumberGutter {...defaultProps} onLineClick={onLineClick} />);

      fireEvent.click(screen.getByText('1'));
      fireEvent.click(screen.getByText('2'));
      fireEvent.click(screen.getByText('3'));

      expect(onLineClick).toHaveBeenCalledTimes(3);
      expect(onLineClick).toHaveBeenNthCalledWith(1, 1, expect.any(Object));
      expect(onLineClick).toHaveBeenNthCalledWith(2, 2, expect.any(Object));
      expect(onLineClick).toHaveBeenNthCalledWith(3, 3, expect.any(Object));
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty virtualItems array', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} virtualItems={[]} />);
      const gutter = container.querySelector('.log-viewer__gutter');

      expect(gutter).toBeInTheDocument();
      expect(gutter?.children.length).toBe(0);
    });

    it('should handle single virtual item', () => {
      const singleItem = [createMockVirtualItem(0, 0)];
      render(<LineNumberGutter {...defaultProps} virtualItems={singleItem} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.queryByText('2')).not.toBeInTheDocument();
    });

    it('should handle large line numbers', () => {
      const largeItem = [createMockVirtualItem(9999, 0)];
      render(<LineNumberGutter {...defaultProps} virtualItems={largeItem} />);

      expect(screen.getByText('10000')).toBeInTheDocument();
    });

    it('should handle very small item sizes', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} itemSize={1} />);
      const cell = container.querySelector('.log-viewer__gutter-cell');

      expect(cell).toHaveStyle({ height: '1px' });
    });

    it('should handle very large item sizes', () => {
      const { container } = render(<LineNumberGutter {...defaultProps} itemSize={100} />);
      const cell = container.querySelector('.log-viewer__gutter-cell');

      expect(cell).toHaveStyle({ height: '100px' });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible links with proper attributes', () => {
      render(<LineNumberGutter {...defaultProps} />);

      const links = screen.getAllByRole('link');
      links.forEach((link, index) => {
        const lineNumber = index + 1;
        expect(link).toHaveAttribute('href', `#L${lineNumber}`);
        expect(link).toHaveAttribute('aria-label', `Jump to line ${lineNumber}`);
      });
    });

    it('should be keyboard navigable', () => {
      render(<LineNumberGutter {...defaultProps} />);

      const link = screen.getByText('1').closest('a');
      expect(link).toHaveClass('log-viewer__line-number');

      // Links should be focusable by default
      link?.focus();
      expect(document.activeElement).toBe(link);
    });
  });

  describe('Integration with Virtual Scrolling', () => {
    it('should handle non-contiguous virtual items', () => {
      // Simulate virtualization where only items 0, 5, and 10 are visible
      const nonContiguousItems = [
        createMockVirtualItem(0, 0),
        createMockVirtualItem(5, 100),
        createMockVirtualItem(10, 200),
      ];

      render(<LineNumberGutter {...defaultProps} virtualItems={nonContiguousItems} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('11')).toBeInTheDocument();
    });

    it('should apply correct transforms for non-sequential items', () => {
      const items = [
        createMockVirtualItem(0, 0),
        createMockVirtualItem(5, 500), // Large gap
        createMockVirtualItem(6, 520),
      ];

      const { container } = render(<LineNumberGutter {...defaultProps} virtualItems={items} />);
      const cells = container.querySelectorAll('.log-viewer__gutter-cell');

      expect(cells[0]).toHaveStyle({ transform: 'translateY(0px)' });
      expect(cells[1]).toHaveStyle({ transform: 'translateY(500px)' });
      expect(cells[2]).toHaveStyle({ transform: 'translateY(520px)' });
    });
  });
});
