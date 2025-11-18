import { render } from '@testing-library/react';
import { IssueSeverity } from '~/kite/issue-type';
import { severityIcon } from '../IssuesListView/utils/issue-utils';

describe('severityIcon', () => {
  describe('IssueSeverity.CRITICAL', () => {
    it('should return CriticalIcon for critical severity', () => {
      const icon = severityIcon(IssueSeverity.CRITICAL);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // CriticalIcon has a specific title
      const title = container.querySelector('title');
      expect(title).toHaveTextContent('Critical');
    });

    it('should render icon with red color for critical severity', () => {
      const icon = severityIcon(IssueSeverity.CRITICAL);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('color', '#a30000');
    });
  });

  describe('IssueSeverity.MAJOR', () => {
    it('should return HighIcon for major severity', () => {
      const icon = severityIcon(IssueSeverity.MAJOR);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // HighIcon has a specific title
      const title = container.querySelector('title');
      expect(title).toHaveTextContent('High');
    });

    it('should render icon with orange color for major severity', () => {
      const icon = severityIcon(IssueSeverity.MAJOR);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('color', '#ec7a08');
    });
  });

  describe('IssueSeverity.MINOR', () => {
    it('should return MediumIcon for minor severity', () => {
      const icon = severityIcon(IssueSeverity.MINOR);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // MediumIcon has a specific title
      const title = container.querySelector('title');
      expect(title).toHaveTextContent('Medium');
    });

    it('should render icon with yellow color for minor severity', () => {
      const icon = severityIcon(IssueSeverity.MINOR);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('color', '#f0ab00');
    });
  });

  describe('IssueSeverity.INFO', () => {
    it('should return LowIcon for info severity', () => {
      const icon = severityIcon(IssueSeverity.INFO);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // LowIcon has a specific title
      const title = container.querySelector('title');
      expect(title).toHaveTextContent('Low');
    });

    it('should render icon with blue color for info severity', () => {
      const icon = severityIcon(IssueSeverity.INFO);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('color', '#2b9af3');
    });
  });

  describe('Default case', () => {
    it('should return UnknownIcon for unknown severity', () => {
      const icon = severityIcon('unknown' as IssueSeverity);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // UnknownIcon has a specific title
      const title = container.querySelector('title');
      expect(title).toHaveTextContent('Unknown');
    });

    it('should render icon with gray color for unknown severity', () => {
      const icon = severityIcon('invalid' as IssueSeverity);
      const { container } = render(<>{icon}</>);

      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('color', '#b8bbbe');
    });
  });

  describe('Return value', () => {
    it('should return a valid React element for critical severity', () => {
      const icon = severityIcon(IssueSeverity.CRITICAL);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('object');
    });

    it('should return a valid React element for major severity', () => {
      const icon = severityIcon(IssueSeverity.MAJOR);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('object');
    });

    it('should return a valid React element for minor severity', () => {
      const icon = severityIcon(IssueSeverity.MINOR);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('object');
    });

    it('should return a valid React element for info severity', () => {
      const icon = severityIcon(IssueSeverity.INFO);
      expect(icon).toBeTruthy();
      expect(typeof icon).toBe('object');
    });
  });
});
