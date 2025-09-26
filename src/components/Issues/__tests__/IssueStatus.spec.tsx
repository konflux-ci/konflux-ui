import { render, screen } from '@testing-library/react';
import { IssueStatus, LockedIcon, UnlockedIcon } from '../IssueStatus';

describe('LockedIcon', () => {
  it('should render lock icon with Resolved title', () => {
    const { container } = render(<LockedIcon />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('color', '#a30000');

    const title = container.querySelector('title');
    expect(title).toHaveTextContent('Resolved');
  });
});

describe('UnlockedIcon', () => {
  it('should render lock open icon with Active title', () => {
    const { container } = render(<UnlockedIcon />);

    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('color', '#5ba352');

    const title = container.querySelector('title');
    expect(title).toHaveTextContent('Active');
  });
});

describe('IssueStatus', () => {
  describe('when locked is true', () => {
    it('should render LockedIcon', () => {
      const { container } = render(<IssueStatus locked={true} />);

      const title = container.querySelector('title');
      expect(title).toHaveTextContent('Resolved');
    });

    it('should render "Resolved" text when not condensed', () => {
      render(<IssueStatus locked={true} />);

      // Text appears in both the icon title and as visible text
      const resolvedTexts = screen.getAllByText('Resolved');
      expect(resolvedTexts.length).toBeGreaterThan(1);
    });

    it('should not render "Resolved" text when condensed is true', () => {
      render(<IssueStatus locked={true} condensed={true} />);

      // Text only appears once (in icon title), not as separate visible text
      const resolvedTexts = screen.getAllByText('Resolved');
      expect(resolvedTexts.length).toBe(1);
    });
  });

  describe('when locked is false', () => {
    it('should render UnlockedIcon', () => {
      const { container } = render(<IssueStatus locked={false} />);

      const title = container.querySelector('title');
      expect(title).toHaveTextContent('Active');
    });

    it('should render "Active" text when not condensed', () => {
      render(<IssueStatus locked={false} />);

      // Text appears in both the icon title and as visible text
      const activeTexts = screen.getAllByText('Active');
      expect(activeTexts.length).toBeGreaterThan(1);
    });

    it('should not render "Active" text when condensed is true', () => {
      render(<IssueStatus locked={false} condensed={true} />);

      // Text only appears once (in icon title), not as separate visible text
      const activeTexts = screen.getAllByText('Active');
      expect(activeTexts.length).toBe(1);
    });
  });

  describe('condensed mode', () => {
    it('should render only icon when condensed is true and locked is true', () => {
      const { container } = render(<IssueStatus locked={true} condensed={true} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Text only appears once (in icon title), not as separate visible text
      const resolvedTexts = screen.getAllByText('Resolved');
      expect(resolvedTexts.length).toBe(1);
    });

    it('should render only icon when condensed is true and locked is false', () => {
      const { container } = render(<IssueStatus locked={false} condensed={true} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Text only appears once (in icon title), not as separate visible text
      const activeTexts = screen.getAllByText('Active');
      expect(activeTexts.length).toBe(1);
    });

    it('should render icon and text when condensed is false and locked is true', () => {
      const { container } = render(<IssueStatus locked={true} condensed={false} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Text appears in both icon title and as visible text
      const resolvedTexts = screen.getAllByText('Resolved');
      expect(resolvedTexts.length).toBeGreaterThan(1);
    });

    it('should render icon and text when condensed is false and locked is false', () => {
      const { container } = render(<IssueStatus locked={false} condensed={false} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Text appears in both icon title and as visible text
      const activeTexts = screen.getAllByText('Active');
      expect(activeTexts.length).toBeGreaterThan(1);
    });

    it('should render icon and text when condensed is undefined (default)', () => {
      const { container } = render(<IssueStatus locked={true} />);

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Text appears in both icon title and as visible text
      const resolvedTexts = screen.getAllByText('Resolved');
      expect(resolvedTexts.length).toBeGreaterThan(1);
    });
  });

  describe('color coding', () => {
    it('should use red color for locked status', () => {
      const { container } = render(<IssueStatus locked={true} />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('color', '#a30000');
    });

    it('should use green color for unlocked status', () => {
      const { container } = render(<IssueStatus locked={false} />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('color', '#5ba352');
    });
  });
});
