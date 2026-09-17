import { screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils';
import { TourRenderer } from '../TourRenderer';
import { TourStepConfig } from '../types';

const mockUseTour = {
  isActive: false,
  currentStep: undefined as TourStepConfig | undefined,
  currentStepIndex: 0,
  totalSteps: 0,
  isFirstStep: true,
  isLastStep: true,
  next: jest.fn(),
  prev: jest.fn(),
  skip: jest.fn(),
  done: jest.fn(),
  startTour: jest.fn(),
  seen: {},
};

jest.mock('../hooks/useTour', () => ({
  useTour: () => mockUseTour,
}));

jest.mock('../steps/ModalStep', () => ({
  ModalStep: (props: { title: string }) => <div data-test="mock-modal-step">{props.title}</div>,
}));
jest.mock('../steps/SpotlightStep', () => ({
  SpotlightStep: (props: { title: string }) => (
    <div data-test="mock-spotlight-step">{props.title}</div>
  ),
}));
jest.mock('../steps/HighlightStep', () => ({
  HighlightStep: (props: { title: string }) => (
    <div data-test="mock-highlight-step">{props.title}</div>
  ),
}));

describe('TourRenderer', () => {
  beforeEach(() => {
    mockUseTour.isActive = false;
    mockUseTour.currentStep = undefined;
  });

  it('renders nothing when tour is inactive', () => {
    const { container } = routerRenderer(<TourRenderer />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders ModalStep for modal type', () => {
    mockUseTour.isActive = true;
    mockUseTour.currentStep = { type: 'modal', title: 'Modal Title', content: 'modal content' };
    routerRenderer(<TourRenderer />);
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
  });

  it('renders SpotlightStep for spotlight type', () => {
    mockUseTour.isActive = true;
    mockUseTour.currentStep = {
      type: 'spotlight',
      target: 'btn',
      title: 'Spot Title',
      content: 'c',
    };
    routerRenderer(<TourRenderer />);
    expect(screen.getByText('Spot Title')).toBeInTheDocument();
  });

  it('renders HighlightStep for highlight type', () => {
    mockUseTour.isActive = true;
    mockUseTour.currentStep = {
      type: 'highlight',
      target: 'btn',
      title: 'High Title',
      content: 'c',
    };
    routerRenderer(<TourRenderer />);
    expect(screen.getByText('High Title')).toBeInTheDocument();
  });
});
