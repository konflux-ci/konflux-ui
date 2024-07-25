import { render } from '@testing-library/react';
import App from '../App';

describe('mock-test', () => {
  it('should return true', () => {
    render(<App />);
    expect(true).toBe(true);
  });
});
