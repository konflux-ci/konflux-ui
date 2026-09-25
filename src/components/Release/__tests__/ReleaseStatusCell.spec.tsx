import { render, screen } from '@testing-library/react';
import { ReleaseCondition, ReleaseKind } from '~/types';
import ReleaseStatusCell from '../ReleaseStatusCell';

const baseRelease: ReleaseKind = {
  apiVersion: 'appstudio.redhat.com/v1alpha1',
  kind: 'Release',
  metadata: {
    name: 'test-release',
    namespace: 'test-ns',
    uid: 'uid-1',
  },
  spec: {
    releasePlan: 'plan-a',
    snapshot: 'snapshot-a',
  },
};

describe('ReleaseStatusCell', () => {
  it('should render Unknown when release has no conditions', () => {
    render(<ReleaseStatusCell release={baseRelease} />);

    expect(screen.getByTestId('release-status')).toHaveTextContent('Unknown');
  });

  it('should render Succeeded when Released condition succeeded', () => {
    render(
      <ReleaseStatusCell
        release={{
          ...baseRelease,
          status: {
            conditions: [{ type: ReleaseCondition.Released, reason: 'Succeeded', status: 'True' }],
          },
        }}
      />,
    );

    expect(screen.getByTestId('release-status')).toHaveTextContent('Succeeded');
  });

  it('should render In Progress when Released condition is progressing', () => {
    render(
      <ReleaseStatusCell
        release={{
          ...baseRelease,
          status: {
            conditions: [
              { type: ReleaseCondition.Released, reason: 'Progressing', status: 'True' },
            ],
          },
        }}
      />,
    );

    expect(screen.getByTestId('release-status')).toHaveTextContent('In Progress');
  });

  it('should render Failed when Released condition failed', () => {
    render(
      <ReleaseStatusCell
        release={{
          ...baseRelease,
          status: {
            conditions: [{ type: ReleaseCondition.Released, reason: 'Failed', status: 'False' }],
          },
        }}
      />,
    );

    expect(screen.getByTestId('release-status')).toHaveTextContent('Failed');
  });

  it('should render Pending when Released condition is missing', () => {
    render(
      <ReleaseStatusCell
        release={{
          ...baseRelease,
          status: {
            conditions: [{ type: ReleaseCondition.Validated, reason: 'Succeeded', status: 'True' }],
          },
        }}
      />,
    );

    expect(screen.getByTestId('release-status')).toHaveTextContent('Pending');
  });
});
