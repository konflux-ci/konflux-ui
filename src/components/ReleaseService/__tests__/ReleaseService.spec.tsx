import { screen } from '@testing-library/react';
import { renderWithQueryClientAndRouter } from '../../../utils/test-utils';
import { ReleaseService } from '../ReleaseService';

describe('ReleaseService', () => {
  it('should render release service page', () => {
    renderWithQueryClientAndRouter(<ReleaseService />);
    screen.getByText('Release Plan');
  });
});
