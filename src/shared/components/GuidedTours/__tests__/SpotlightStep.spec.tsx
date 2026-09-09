import { screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import { SpotlightStep } from '../steps/SpotlightStep';

// Mock SpotlightOverlay to avoid SVG rendering complexity in jsdom
jest.mock('../steps/SpotlightOverlay', () => ({
  SpotlightOverlay: () => <div data-test="mock-overlay" />,
}));

// Mock useTargetElement to control target element behavior
jest.mock('../hooks/useTargetElement', () => ({
  useTargetElement: () => ({
    targetEl: document.createElement('div'),
    targetRect: {
      x: 100,
      y: 200,
      width: 300,
      height: 50,
      top: 200,
      right: 400,
      bottom: 250,
      left: 100,
    },
    triggerRef: { current: document.createElement('div') },
  }),
}));

describe('SpotlightStep', () => {
  const defaultProps = {
    title: 'Spotlight Title',
    content: 'Spotlight content',
    target: 'test-target',
    currentStep: 1,
    totalSteps: 3,
    isFirstStep: false,
    isLastStep: false,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSkip: jest.fn(),
    onDone: jest.fn(),
  };

  it('renders title and content in popover', () => {
    routerRenderer(<SpotlightStep {...defaultProps} />);
    expect(screen.getByText('Spotlight Title')).toBeInTheDocument();
    expect(screen.getByText('Spotlight content')).toBeInTheDocument();
  });

  it('renders spotlight overlay', () => {
    routerRenderer(<SpotlightStep {...defaultProps} />);
    expect(screen.getByTestId('mock-overlay')).toBeInTheDocument();
  });

  it('renders step navigation', () => {
    routerRenderer(<SpotlightStep {...defaultProps} />);
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });
});
