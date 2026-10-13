import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '~/unit-test-utils';
import { MintMakerScheduleNotFoundState } from '../MintMakerScheduleNotFoundState';

describe('MintMakerScheduleNotFoundState', () => {
  it('renders the schedule-not-available title', () => {
    renderWithQueryClientAndRouter(<MintMakerScheduleNotFoundState />);
    expect(screen.getByText('Schedule not available')).toBeInTheDocument();
  });

  it('renders the explanatory body text', () => {
    renderWithQueryClientAndRouter(<MintMakerScheduleNotFoundState />);
    expect(
      screen.getByText(/The MintMaker schedule has not been calculated yet/),
    ).toBeInTheDocument();
  });
});
