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

  it('should display "True" when block-releases label is set to true', () => {
    const wrapper = render(
      <ReleasePlanAdmissionListRow obj={mockReleasePlanAdmission} columns={[]} />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('True');
  });

  it('should display "False" when block-releases label is set to false', () => {
    const mockRPAWithBlockReleasesFalse = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: {
          'release.appstudio.openshift.io/block-releases': 'false',
        },
      },
      application: mockApplicationWithDisplayName,
    };

    const wrapper = render(
      <ReleasePlanAdmissionListRow obj={mockRPAWithBlockReleasesFalse} columns={[]} />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('False');
  });

  it('should display "-" when block-releases label is missing', () => {
    const mockRPAWithoutBlockReleasesLabel = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: {},
      },
      application: mockApplicationWithDisplayName,
    };

    const wrapper = render(
      <ReleasePlanAdmissionListRow obj={mockRPAWithoutBlockReleasesLabel} columns={[]} />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('-');
  });

  it('should display "-" when labels object is undefined', () => {
    const mockRPAWithoutLabels = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: undefined,
      },
      application: mockApplicationWithDisplayName,
    };

    const wrapper = render(
      <ReleasePlanAdmissionListRow obj={mockRPAWithoutLabels} columns={[]} />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('-');
  });

  it('should display "-" when labels exist but block-releases label is missing', () => {
    const mockRPAWithOtherLabels = {
      ...mockReleasePlanAdmission,
      metadata: {
        ...mockReleasePlanAdmission.metadata,
        labels: {
          'some.other.label': 'value',
          'another.label': 'another-value',
        },
      },
      application: mockApplicationWithDisplayName,
    };

    const wrapper = render(
      <ReleasePlanAdmissionListRow obj={mockRPAWithOtherLabels} columns={[]} />,
      {
        container: document.createElement('tr'),
      },
    );
    const cells = wrapper.container.getElementsByTagName('td');

    expect(cells[3].innerHTML).toBe('-');
  });
});
