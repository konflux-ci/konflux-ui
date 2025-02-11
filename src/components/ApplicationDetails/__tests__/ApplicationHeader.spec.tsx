import { render, screen } from '@testing-library/react';
import { ApplicationKind } from '../../../types';
import { ApplicationHeader } from '../ApplicationHeader';

describe('ApplicationHeader', () => {
  it('should render Application header', () => {
    render(
      <ApplicationHeader
        application={
          {
            metadata: { name: 'application-1', annotations: {} },
            spec: { displayName: 'Application 1' },
          } as ApplicationKind
        }
      />,
    );
    expect(screen.getByText('Application 1')).toBeInTheDocument();
  });
});
