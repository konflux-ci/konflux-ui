import { configure, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useComponents, useSortedGroupComponents } from '../../../hooks/useComponents';
import {
  componentCRMocks,
  sortedGroupedComponentsMocks,
} from '../../Components/__data__/mock-data';
import {
  ComponentRelationModal,
  createComponentRelationModal,
} from '../ComponentRelationModal';
import { ComponentRelationNudgeType, ComponentRelationValue } from '../type';
import { useNudgeData } from '../useNudgeData';
import { updateNudgeDependencies } from '../utils';

configure({ testIdAttribute: 'id' });

jest.mock('../../../hooks/useComponents', () => ({
  useComponents: jest.fn(() => [[componentCRMocks[0]], true, null]),
  useSortedGroupComponents: jest.fn(() => [sortedGroupedComponentsMocks, true, null]),
}));

jest.mock('../../../utils/analytics', () => ({
  ...jest.requireActual('../../../utils/analytics'),
  useTrackEvent: jest.fn(() => () => {}),
}));

jest.mock('../utils', () => ({
  ...jest.requireActual('../utils'),
  updateNudgeDependencies: jest.fn(),
}));

jest.mock('../useNudgeData', () => ({
  useNudgeData: jest.fn(),
}));

class MockResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

const mockComponentRelations: ComponentRelationValue[] = [
  {
    source: 'a',
    nudgeType: ComponentRelationNudgeType.NUDGES,
    target: ['b'],
  },
  {
    source: 'c',
    nudgeType: ComponentRelationNudgeType.NUDGES,
    target: ['d'],
  },
];

window.ResizeObserver = MockResizeObserver;
const useNudgeDataMock = useNudgeData as jest.Mock;
const updateNudgeDependenciesMock = updateNudgeDependencies as jest.Mock;
const useComponentsMock = useComponents as jest.Mock;
const useSortedGroupComponentsMock = useSortedGroupComponents as jest.Mock;

describe('ComponentRelationModal', () => {
  beforeEach(() => {
    useNudgeDataMock.mockReturnValue([[], true, null]);
    useComponentsMock.mockReturnValue([[componentCRMocks[0]], true, null]);
    useSortedGroupComponentsMock.mockReturnValue([sortedGroupedComponentsMocks, true, null]);
    updateNudgeDependenciesMock.mockResolvedValue(componentCRMocks);
  });

  it('should render modal', () => {
    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);
    screen.getByText('Component relationships');
  });

  it('should render dropdowns', () => {
    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);
    expect(screen.getAllByTestId('toggle-component-menu')).toHaveLength(2);
  });

  it('should remove a relation', () => {
    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);
    expect(screen.queryAllByTestId(/remove-relation-\d+/)).toHaveLength(1);
    fireEvent.click(screen.getByText(`Add another component relationship`));
    expect(screen.getAllByTestId(/remove-relation-\d+/)).toHaveLength(2);
    fireEvent.click(screen.getByTestId('remove-relation-0'));
    expect(screen.queryAllByTestId(/remove-relation-\d+/)).toHaveLength(1);
  });

  it('should reset the only relation instead of removing it', () => {
    useNudgeDataMock.mockReturnValue([[mockComponentRelations[0]], true, null]);

    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);

    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.queryAllByTestId(/remove-relation-\d+/)).toHaveLength(1);

    fireEvent.click(screen.getByTestId('remove-relation-0'));

    expect(screen.queryAllByTestId(/remove-relation-\d+/)).toHaveLength(1);
    expect(screen.getByText('Select a component')).toBeInTheDocument();
    expect(screen.queryByText('a')).not.toBeInTheDocument();
  });

  it('should show cancelation modal when clicked on cancel', () => {
    let isOpen = true;
    const onClose = () => {
      isOpen = false;
    };
    const { rerender } = render(
      <ComponentRelationModal modalProps={{ isOpen, onClose }} application="apps" />,
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Your changes will be lost!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Go back'));
    expect(screen.queryByText('Your changes will be lost!')).not.toBeInTheDocument();
    expect(screen.queryByText('Component relationships')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Your changes will be lost!')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Close anyway'));
    rerender(<ComponentRelationModal modalProps={{ isOpen, onClose }} application="apps" />);
    expect(screen.queryByText('Your changes will be lost!')).not.toBeInTheDocument();
  });

  it('should render new relationship on clicking `add another component relationship`', () => {
    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);
    screen.getByText('Component relationships');
    expect(screen.getAllByTestId('toggle-component-menu')).toHaveLength(2);
    fireEvent.click(screen.getByText(`Add another component relationship`));
    expect(screen.getAllByTestId('toggle-component-menu')).toHaveLength(4);
  });

  it('should show confirmation modal on relationship save', async () => {
    useNudgeDataMock.mockReturnValue([mockComponentRelations, true, null]);
    updateNudgeDependenciesMock.mockResolvedValue(componentCRMocks);
    let isOpen = true;
    const onClose = () => {
      isOpen = false;
    };
    const { rerender } = render(
      <ComponentRelationModal modalProps={{ isOpen, onClose }} application="apps" />,
    );
    expect(screen.queryByText('Component relationships')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('nudged-by-0'));
    const saveButton = screen.getByText('Save relationships');
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);
    expect(saveButton.getAttribute('class')).toContain('pf-m-in-progress');
    await waitFor(() => {
      expect(saveButton.getAttribute('class')).toContain('pf-m-in-progress');
    });

    rerender(<ComponentRelationModal modalProps={{ isOpen, onClose }} application="apps" />);
    await waitFor(() => {
      expect(screen.queryByText('Relationships updated!')).toBeInTheDocument();
    });

    const doneButton = screen.getByText('Done');
    fireEvent.click(doneButton);
  });

  it('should display an error on failure', async () => {
    useNudgeDataMock.mockReturnValue([mockComponentRelations, true, null]);
    updateNudgeDependenciesMock.mockRejectedValue(new Error('error'));
    let isOpen = true;
    const onClose = () => {
      isOpen = false;
    };
    render(<ComponentRelationModal modalProps={{ isOpen, onClose }} application="apps" />);
    expect(screen.queryByText('Component relationships')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('nudged-by-0'));
    const saveButton = screen.getByText('Save relationships');
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);
    expect(await screen.findByText('error')).toBeInTheDocument();
  });

  it('should display an error when validation passes but save fails', async () => {
    useNudgeDataMock.mockReturnValue([mockComponentRelations, true, null]);
    updateNudgeDependenciesMock
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('save failed'));
    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);
    fireEvent.click(screen.getByTestId('nudged-by-0'));
    const saveButton = screen.getByText('Save relationships');
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);
    expect(await screen.findByText('save failed')).toBeInTheDocument();
  });

  it('should display a string error when rejection is not an Error instance', async () => {
    useNudgeDataMock.mockReturnValue([mockComponentRelations, true, null]);
    updateNudgeDependenciesMock.mockRejectedValue('plain error');
    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);
    fireEvent.click(screen.getByTestId('nudged-by-0'));
    const saveButton = screen.getByText('Save relationships');
    await waitFor(() => expect(saveButton).not.toBeDisabled());
    fireEvent.click(saveButton);
    expect(await screen.findByText('plain error')).toBeInTheDocument();
  });

  it('should render with empty component data when hooks return errors', () => {
    useComponentsMock.mockReturnValue([[], true, new Error('component error')]);
    useSortedGroupComponentsMock.mockReturnValue([{}, true, new Error('grouped error')]);

    render(<ComponentRelationModal modalProps={{ isOpen: true }} application="apps" />);

    expect(screen.getByText('Component relationships')).toBeInTheDocument();
    expect(screen.getAllByTestId('toggle-component-menu')).toHaveLength(2);
  });

  it('should create modal launcher', () => {
    const launcher = createComponentRelationModal({ application: 'test-app' });
    expect(typeof launcher).toBe('function');
  });
});
