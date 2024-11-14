import { render, screen } from '@testing-library/react';
import AboutSection from '../AboutSection';

describe('About section', () => {
  it('should render everything correctly in about section', () => {
    render(<AboutSection />);
    screen.getByText('About');
    screen.getByText('Contact us');
  });

  it('should render the links correctly in about section', () => {
    render(<AboutSection />);
    expect(screen.getByRole('link', { name: 'repository' })).toBeInTheDocument();
  });
});
