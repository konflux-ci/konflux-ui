import { screen, fireEvent } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import { ModalStep } from '../steps/ModalStep';

describe('ModalStep', () => {
  const defaultProps = {
    title: 'Welcome',
    content: 'Hello world',
    currentStep: 0,
    totalSteps: 3,
    isFirstStep: true,
    isLastStep: false,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onSkip: jest.fn(),
    onDone: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title and content', () => {
    routerRenderer(<ModalStep {...defaultProps} />);
    expect(screen.getByText('Welcome')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('renders step navigation', () => {
    routerRenderer(<ModalStep {...defaultProps} />);
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('calls onSkip when close button clicked', () => {
    routerRenderer(<ModalStep {...defaultProps} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(defaultProps.onSkip).toHaveBeenCalled();
  });
});
