import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { createUseParamsMock, routerRenderer } from '~/unit-test-utils/mock-react-router';
import { IntegrationTestCreateForm } from '../IntegrationTestCreateForm';

// IntegrationTestView has its own tests. We mock it here to focus on
// testing IntegrationTestCreateForm's specific logic: extracting applicationName
// from URL params and passing it to IntegrationTestView.
jest.mock('../IntegrationTestView', () => ({
  __esModule: true,
  default: jest.fn(({ applicationName }) => (
    <div data-test="integration-test-view">IntegrationTestView - {applicationName}</div>
  )),
}));

describe('IntegrationTestCreateForm', () => {
  const useParamsMock = createUseParamsMock();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render IntegrationTestView with applicationName from params', () => {
    const mockApplicationName = 'test-application';
    useParamsMock.mockReturnValue({ applicationName: mockApplicationName });

    routerRenderer(<IntegrationTestCreateForm />);

    expect(screen.getByTestId('integration-test-view')).toBeInTheDocument();
    expect(screen.getByText(`IntegrationTestView - ${mockApplicationName}`)).toBeInTheDocument();
  });

  it('should pass undefined applicationName when not in params', () => {
    useParamsMock.mockReturnValue({});

    routerRenderer(<IntegrationTestCreateForm />);

    const view = screen.getByTestId('integration-test-view');
    expect(view).toBeInTheDocument();
    expect(view.textContent).toMatch(/IntegrationTestView -\s*$/);
  });

  it('should update when applicationName param changes', () => {
    const firstApp = 'first-app';
    useParamsMock.mockReturnValue({ applicationName: firstApp });

    const { rerender } = routerRenderer(<IntegrationTestCreateForm />);
    expect(screen.getByText(`IntegrationTestView - ${firstApp}`)).toBeInTheDocument();

    const secondApp = 'second-app';
    useParamsMock.mockReturnValue({ applicationName: secondApp });

    rerender(<IntegrationTestCreateForm />);
    expect(screen.getByText(`IntegrationTestView - ${secondApp}`)).toBeInTheDocument();
  });
});
