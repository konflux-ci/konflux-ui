import { render } from '@testing-library/react';
import BeginningSection from '../components/BeginningSection';

const setCurrentSectionMock = jest.fn();

describe('BeginningSection', () => {
  it('should initialize with BeginingSection', () => {
    const screen = render(<BeginningSection setCurrentSection={setCurrentSectionMock} />);
    screen.getByText('Share feedback');
    screen.getByText('Report a bug');
    screen.getByText('Request a new feature');
  });
});
