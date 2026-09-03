import { screen, fireEvent } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import { StepNavigation } from '../steps/StepNavigation';

describe('StepNavigation', () => {
  const defaultProps = {
    currentStep: 0,
    totalSteps: 3,
    isFirstStep: true,
    isLastStep: false,
    onNext: jest.fn(),
    onPrev: jest.fn(),
    onDone: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders step counter', () => {
    routerRenderer(<StepNavigation {...defaultProps} />);
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  it('hides Back button on first step', () => {
    routerRenderer(<StepNavigation {...defaultProps} isFirstStep />);
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
  });

  it('shows Back button on non-first step', () => {
    routerRenderer(<StepNavigation {...defaultProps} isFirstStep={false} currentStep={1} />);
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });

  it('shows Next button when not last step', () => {
    routerRenderer(<StepNavigation {...defaultProps} />);
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
  });

  it('shows Done button on last step', () => {
    routerRenderer(<StepNavigation {...defaultProps} isLastStep currentStep={2} />);
    expect(screen.getByRole('button', { name: /done/i })).toBeInTheDocument();
  });

  it('calls onNext when Next clicked', () => {
    routerRenderer(<StepNavigation {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(defaultProps.onNext).toHaveBeenCalled();
  });

  it('calls onPrev when Back clicked', () => {
    routerRenderer(<StepNavigation {...defaultProps} isFirstStep={false} currentStep={1} />);
    fireEvent.click(screen.getByRole('button', { name: /back/i }));
    expect(defaultProps.onPrev).toHaveBeenCalled();
  });

  it('calls onDone when Done clicked', () => {
    routerRenderer(<StepNavigation {...defaultProps} isLastStep currentStep={2} />);
    fireEvent.click(screen.getByRole('button', { name: /done/i }));
    expect(defaultProps.onDone).toHaveBeenCalled();
  });
});
