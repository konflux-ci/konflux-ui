import { render } from '@testing-library/react';
import {
  mockApplicationWithDisplayName,
  mockApplicationWithoutDisplayName,
} from '../../ReleasePlan/__data__/release-plan.mock';
import { mockReleasePlanAdmission } from '../__data__/release-plan-admission.mock';
import ReleasePlanAdmissionListRow from '../ReleasePlanAdmissionListRow';

describe('ReleasePlanAdmissionListRow', () => {
  it('should render release plan admission data into table cells', () => {
    const wrapper = render(
      <ReleasePlanAdmissionListRow
        obj={{ ...mockReleasePlanAdmission, application: mockApplicationWithDisplayName }}
        columns={[]}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].innerHTML).toBe(mockReleasePlanAdmission.metadata.name);
    expect(cells[1].innerHTML).toBe(mockApplicationWithDisplayName.spec.displayName);
    expect(cells[2].innerHTML).toBe('sbudhwar-1-tenant');
    expect(cells[3].innerHTML).toBe('True');
  });

  it('should fallback to application metadata name when displayName not there', () => {
    const wrapper = render(
      <ReleasePlanAdmissionListRow
        obj={{ ...mockReleasePlanAdmission, application: mockApplicationWithoutDisplayName }}
        columns={[]}
      />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[0].innerHTML).toBe(mockReleasePlanAdmission.metadata.name);
    expect(cells[1].innerHTML).toBe('my-app-1');
    expect(cells[2].innerHTML).toBe('sbudhwar-1-tenant');
    expect(cells[3].innerHTML).toBe('True');
  });
});
