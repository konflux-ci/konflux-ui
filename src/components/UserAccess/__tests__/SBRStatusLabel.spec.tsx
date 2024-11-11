import { screen, render } from '@testing-library/react';
import { SpaceBindingRequest } from '../../../types';
import { createK8sWatchResourceMock } from '../../../utils/test-utils';
import { SBRStatusLabel } from '../SBRStatusLabel';

const watchMock = createK8sWatchResourceMock();

describe('SBRStatusLabel', () => {
  it('should not render label if status is not available', () => {
    const sbr: SpaceBindingRequest = {
      apiVersion: 'appstudio.redhat.com/v1alpha1',
      kind: 'SpaceBindingRequest',
      metadata: {
        name: 'test-sbr',
      },
      spec: {
        masterUserRecord: 'user',
        spaceRole: 'contributor',
      },
    };

    watchMock.mockReturnValueOnce([sbr, true]);
    render(<SBRStatusLabel sbr={{ name: 'test-sbr', namespace: 'test-ns' }} />);
    expect(screen.getByText('-')).toBeVisible();
  });

  it('should not render label if sbr is not loaded', () => {
    watchMock.mockReturnValueOnce([null, false]);
    render(<SBRStatusLabel sbr={{ name: 'test-sbr', namespace: 'test-ns' }} />);
    expect(screen.getByText('-')).toBeVisible();
  });

  it('should render green label for provisioned sbr', () => {
    const sbr: SpaceBindingRequest = {
      apiVersion: 'appstudio.redhat.com/v1alpha1',
      kind: 'SpaceBindingRequest',
      metadata: {
        name: 'test-sbr',
      },
      spec: {
        masterUserRecord: 'user',
        spaceRole: 'contributor',
      },
      status: {
        conditions: [
          {
            reason: 'Provisioned',
            status: 'True',
          },
        ],
      },
    };

    watchMock.mockReturnValueOnce([sbr, true]);
    render(<SBRStatusLabel sbr={{ name: 'test-sbr', namespace: 'test-ns' }} />);
    expect(screen.getByText('Provisioned')).toBeVisible();
    expect(screen.getByText('Provisioned').parentElement.parentElement).toHaveClass('pf-m-green');
  });

  it('should render gold label for non-provisioned sbr', () => {
    const sbr: SpaceBindingRequest = {
      apiVersion: 'appstudio.redhat.com/v1alpha1',
      kind: 'SpaceBindingRequest',
      metadata: {
        name: 'test-sbr',
      },
      spec: {
        masterUserRecord: 'user',
        spaceRole: 'contributor',
      },
      status: {
        conditions: [
          {
            reason: 'UnknownError',
            status: 'False',
          },
        ],
      },
    };

    watchMock.mockReturnValueOnce([sbr, true]);
    render(<SBRStatusLabel sbr={{ name: 'test-sbr', namespace: 'test-ns' }} />);
    expect(screen.getByText('UnknownError')).toBeVisible();
    expect(screen.getByText('UnknownError').parentElement.parentElement).toHaveClass('pf-m-gold');
  });
});
