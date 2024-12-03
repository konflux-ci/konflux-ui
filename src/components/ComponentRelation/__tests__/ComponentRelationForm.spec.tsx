import { act, configure, fireEvent, screen } from '@testing-library/react';
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
        groupedComponents={{ app: ['asdf', 'asd'] }}
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
    // mouseOver help icon
    const nodgeSvg = screen.getAllByRole('img', { hidden: true })[1];
    act(() => {
      fireEvent.mouseEnter(nodgeSvg);
    });
    expect(nodgeSvg.getAttributeNames().includes('aria-describedby'));
  });
});
