import { screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import { HighlightStep } from '../steps/HighlightStep';

// Mock useTargetElement
const mockTargetEl = document.createElement('div');
const mockUseTargetElement = jest.fn().mockReturnValue({
  targetEl: mockTargetEl,
  targetRect: {
    x: 50,
    y: 100,
    width: 200,
    height: 40,
    top: 100,
    right: 250,
    bottom: 140,
    left: 50,
  },
  triggerRef: { current: mockTargetEl },
});
jest.mock('../hooks/useTargetElement', () => ({
  useTargetElement: (...args: unknown[]) => mockUseTargetElement(...args),
}));

describe('HighlightStep', () => {
  const defaultProps = {
    title: 'Highlight Title',
    content: 'Highlight content',
    target: 'highlight-target',
    currentStep: 0,
    totalSteps: 2,
    isFirstStep: true,
    isLastStep: false,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSkip: jest.fn(),
    onDone: jest.fn(),
  };

  beforeEach(() => {
    mockTargetEl.className = '';
  });

  it('renders title and content in popover', () => {
    routerRenderer(<HighlightStep {...defaultProps} />);
    expect(screen.getByText('Highlight Title')).toBeInTheDocument();
    expect(screen.getByText('Highlight content')).toBeInTheDocument();
  });

  it('adds highlight ring class to target element', () => {
    routerRenderer(<HighlightStep {...defaultProps} />);
    expect(mockTargetEl.classList.contains('guided-tours__highlight-ring')).toBe(true);
  });

  it('renders step navigation', () => {
    routerRenderer(<HighlightStep {...defaultProps} />);
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
  });

  it('renders nothing when target element is not found', () => {
    mockUseTargetElement.mockReturnValueOnce({
      targetEl: null,
      targetRect: null,
      triggerRef: { current: null },
    });
    const { container } = routerRenderer(<HighlightStep {...defaultProps} />);
    expect(container).toBeEmptyDOMElement();
  });
});
