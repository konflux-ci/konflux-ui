import { render, screen } from '@testing-library/react';
import AppEmptyState from '../AppEmptyState';

const MockSvgComponent = (props: SVGSVGElement) => (
  <svg data-test="mock-svg" {...(props as unknown as React.SVGProps<SVGSVGElement>)} />
);
const MockSvg = MockSvgComponent as unknown as React.ComponentType<SVGSVGElement>;

describe('AppEmptyState', () => {
  it('should render the title', () => {
    render(
      <AppEmptyState emptyStateImg={MockSvg} title="Test title">
        <p>body</p>
      </AppEmptyState>,
    );
    expect(screen.getByText('Test title')).toBeInTheDocument();
  });

  it('should render the icon when emptyStateImg is an SVG component', () => {
    render(
      <AppEmptyState emptyStateImg={MockSvg} title="SVG test">
        <p>body</p>
      </AppEmptyState>,
    );
    expect(screen.getByTestId('mock-svg')).toBeInTheDocument();
    expect(screen.getByTestId('mock-svg')).toHaveClass('app-empty-state__icon');
  });

  it('should render the icon when emptyStateImg is a string URL', () => {
    render(
      <AppEmptyState emptyStateImg="/test-image.png" title="URL test">
        <p>body</p>
      </AppEmptyState>,
    );
    const img = document.querySelector('img[src="/test-image.png"]');
    expect(img).toBeInTheDocument();
    expect(img).toHaveClass('app-empty-state__icon');
  });

  it('should apply xl class when isXl is true', () => {
    render(
      <AppEmptyState emptyStateImg={MockSvg} title="XL test" isXl>
        <p>body</p>
      </AppEmptyState>,
    );
    expect(screen.getByTestId('mock-svg')).toHaveClass('m-is-xl');
  });

  it('should render children in the footer', () => {
    render(
      <AppEmptyState emptyStateImg={MockSvg} title="Footer test">
        <p>footer content</p>
      </AppEmptyState>,
    );
    expect(screen.getByText('footer content')).toBeInTheDocument();
  });
});
