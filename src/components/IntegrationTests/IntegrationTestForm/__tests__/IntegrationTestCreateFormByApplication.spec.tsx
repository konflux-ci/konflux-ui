import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import IntegrationTestCreateFormByApplication from '../IntegrationTestCreateFormByApplication';

jest.mock('../IntegrationTestViewByApplication', () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-test="integration-test-view-by-application">IntegrationTestViewByApplication</div>
  )),
}));

describe('IntegrationTestCreateFormByApplication', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render IntegrationTestViewByApplication for creating a test', () => {
    routerRenderer(<IntegrationTestCreateFormByApplication />);

    expect(screen.getByTestId('integration-test-view-by-application')).toBeInTheDocument();
    expect(screen.getByText('IntegrationTestViewByApplication')).toBeInTheDocument();
  });
});
