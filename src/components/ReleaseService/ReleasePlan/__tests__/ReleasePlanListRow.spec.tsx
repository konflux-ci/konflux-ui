import { render } from '@testing-library/react';
import {
  mockApplicationWithDisplayName,
  mockApplicationWithoutDisplayName,
  mockReleasePlan,
} from '../__data__/release-plan.mock';
import ReleasePlanListRow from '../ReleasePlanListRow';

jest.mock('react-router-dom', () => ({
  Link: (props) => <a href={props.to}>{props.children}</a>,
}));

describe('ReleasePlanListRow', () => {
  it('should render release plan data into table cells', () => {
    const wrapper = render(
      <ReleasePlanListRow
        obj={{
          ...mockReleasePlan,
          application: mockApplicationWithDisplayName,
        }}
        columns={[]}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].innerHTML).toBe(mockReleasePlan.metadata.name);
    expect(cells[1].children[0].innerHTML).toBe(mockApplicationWithDisplayName.spec.displayName);
    expect(cells[2].innerHTML).toBe('rorai-tenant');
    expect(cells[3].innerHTML).toBe('True');
    expect(cells[4].innerHTML).toBe('True');
  });

  it('should fallback to application metadata name when displayName not there', () => {
    const wrapper = render(
      <ReleasePlanListRow
        obj={{
          ...mockReleasePlan,
          application: mockApplicationWithoutDisplayName,
        }}
        columns={[]}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].innerHTML).toBe(mockReleasePlan.metadata.name);
    expect(cells[1].children[0].innerHTML).toBe(mockApplicationWithDisplayName.metadata.name);
    expect(cells[2].innerHTML).toBe('rorai-tenant');
    expect(cells[3].innerHTML).toBe('True');
    expect(cells[4].innerHTML).toBe('True');
  });
});
