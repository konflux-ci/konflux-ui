import { act, configure, fireEvent, screen, waitFor } from '@testing-library/react';
import { formikRenderer } from '../../../utils/test-utils';
import { ComponentRelation } from '../ComponentRelationForm';
import { ComponentRelationNudgeType } from '../type';

configure({ testIdAttribute: 'id' });

const defaultRelation = {
  source: 'asdf',
  target: ['asd'],
  nudgeType: ComponentRelationNudgeType.NUDGES,
};

describe('ComponentRelationForm', () => {
  it('should render component relation form', () => {
    formikRenderer(
      <ComponentRelation
        index={0}
        componentNames={['asdf', 'asd']}
        sortedGroupedComponents={{ app: ['asdf', 'asd'] }}
        removeProps={{
          disableRemove: true,
          onRemove: jest.fn(),
        }}
      />,
      {
        relations: [defaultRelation],
      },
    );
    expect(screen.getAllByTestId('toggle-component-menu')).toHaveLength(2);
    expect(screen.getAllByTestId('nudges-0')).toHaveLength(1);
    expect(screen.getAllByTestId('nudged-by-0')).toHaveLength(1);

    const nudgesButton = screen.getByRole('button', { name: 'Nudges' });
    act(() => {
      fireEvent.mouseEnter(nudgesButton);
    });
    expect(
      screen.getByText("The component's builds propagate changes to the nudged component."),
    ).toBeInTheDocument();
  });

  it('should show nudged by tooltip and switch nudge type', () => {
    formikRenderer(
      <ComponentRelation
        index={0}
        componentNames={['asdf', 'asd']}
        sortedGroupedComponents={{ app: ['asdf', 'asd'] }}
        removeProps={{
          disableRemove: true,
          onRemove: jest.fn(),
        }}
      />,
      {
        relations: [defaultRelation],
      },
    );

    const nudgedByButton = screen.getByRole('button', { name: 'Nudged by' });
    act(() => {
      fireEvent.mouseEnter(nudgedByButton);
    });
    expect(
      screen.getByText("The component will be changed by nudging component's build."),
    ).toBeInTheDocument();

    fireEvent.click(nudgedByButton);
    expect(nudgedByButton).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Nudges' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should call onRemove when remove button is clicked', () => {
    const onRemove = jest.fn();

    formikRenderer(
      <ComponentRelation
        index={0}
        componentNames={['asdf', 'asd']}
        sortedGroupedComponents={{ app: ['asdf', 'asd'] }}
        removeProps={{
          disableRemove: false,
          onRemove,
        }}
      />,
      {
        relations: [defaultRelation],
      },
    );

    fireEvent.click(screen.getByTestId('remove-relation-0'));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('should not render target labels when no targets are selected', () => {
    formikRenderer(
      <ComponentRelation
        index={0}
        componentNames={['asdf', 'asd']}
        sortedGroupedComponents={{ app: ['asdf', 'asd'] }}
        removeProps={{
          disableRemove: true,
          onRemove: jest.fn(),
        }}
      />,
      {
        relations: [{ source: 'asdf', target: [], nudgeType: ComponentRelationNudgeType.NUDGES }],
      },
    );

    expect(screen.queryByLabelText('Selected components to nudge')).not.toBeInTheDocument();
    expect(screen.queryByText('+ 1 more')).not.toBeInTheDocument();
  });

  it('should remove a target component when clicking label close button', async () => {
    formikRenderer(
      <ComponentRelation
        index={0}
        componentNames={['source', 'target-1', 'target-2']}
        sortedGroupedComponents={{ app: ['source', 'target-1', 'target-2'] }}
        removeProps={{
          disableRemove: true,
          onRemove: jest.fn(),
        }}
      />,
      {
        relations: [
          {
            source: 'source',
            target: ['target-1', 'target-2'],
            nudgeType: ComponentRelationNudgeType.NUDGES,
          },
        ],
      },
    );

    expect(screen.getByText('target-1')).toBeInTheDocument();
    expect(screen.getByText('target-2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Remove target-1' }));

    await waitFor(() => {
      expect(screen.queryByText('target-1')).not.toBeInTheDocument();
    });
    expect(screen.getByText('target-2')).toBeInTheDocument();
  });

  it('should open target multiselect when clicking overflow label', async () => {
    formikRenderer(
      <ComponentRelation
        index={0}
        componentNames={['source', 'target-1', 'target-2', 'target-3', 'target-4']}
        sortedGroupedComponents={{
          app: ['source', 'target-1', 'target-2', 'target-3', 'target-4'],
        }}
        removeProps={{
          disableRemove: true,
          onRemove: jest.fn(),
        }}
      />,
      {
        relations: [
          {
            source: 'source',
            target: ['target-1', 'target-2', 'target-3', 'target-4'],
            nudgeType: ComponentRelationNudgeType.NUDGES,
          },
        ],
      },
    );

    expect(screen.getByText('+ 1 more')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Search components...')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('+ 1 more'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search components...')).toBeInTheDocument();
    });
  });
});
