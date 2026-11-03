import { render, screen } from '@testing-library/react';
import TaskRunInfrastructureDiagnostic from '../TaskRunInfrastructureDiagnostic';

describe('TaskRunInfrastructureDiagnostic', () => {
  it('renders the diagnostic as literal text under its label', () => {
    const message =
      'Last observed Pod warning: FailedMount: secret "missing" not found <img src=x onerror=alert(1)>';

    render(<TaskRunInfrastructureDiagnostic message={message} />);

    expect(screen.getByText('Infrastructure diagnostic')).toBeInTheDocument();
    expect(screen.getByText(message, { normalizer: (text) => text }).textContent).toBe(message);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it.each([undefined, ''])('omits the group when the message is %s', (message) => {
    render(<TaskRunInfrastructureDiagnostic message={message} />);

    expect(screen.queryByText('Infrastructure diagnostic')).not.toBeInTheDocument();
  });
});
