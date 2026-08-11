import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { MintMakerScheduleEmptyState } from '../MintMakerScheduleEmptyState';

describe('MintMakerScheduleEmptyState', () => {
  it('renders the no-upcoming-runs title', () => {
    renderWithQueryClientAndRouter(<MintMakerScheduleEmptyState />);
    expect(screen.getByText('No upcoming runs scheduled')).toBeInTheDocument();
  });

  it('renders the explanatory body text', () => {
    renderWithQueryClientAndRouter(<MintMakerScheduleEmptyState />);
    expect(
      screen.getByText(
        /MintMaker has not scheduled any upcoming dependency update runs for this cluster/,
      ),
    ).toBeInTheDocument();
  });
});
