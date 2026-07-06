import { act, configure, fireEvent, screen, waitFor } from '@testing-library/react';
import { formikRenderer } from '../../../utils/test-utils';
import { ComponentRelation } from '../ComponentRelationForm';
import { ComponentRelationNudgeType } from '../type';

configure({ testIdAttribute: 'id' });

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
        relations: [
          { source: 'asdf', target: ['asd'], nudgeType: ComponentRelationNudgeType.NUDGES },
        ],
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
