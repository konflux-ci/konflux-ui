import { render } from '@testing-library/react';
import BeginningSection from '../components/BeginningSection';

const setCurrentSectionMock = jest.fn();
const onCancelMock = jest.fn();

describe('BeginningSection', () => {
  it('should initialize with BeginingSection', () => {
    const screen = render(<BeginningSection setCurrentSection={setCurrentSectionMock} onClose={onCancelMock}/>);
    screen.getByText('Share feedback');
    screen.getByText('Report a bug');
    screen.getByText('Request a new feature');
  });
});
