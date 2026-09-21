import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';
import { routerRenderer } from '~/unit-test-utils/mock-react-router';
import IntegrationTestCreateFormByGroup from '../IntegrationTestCreateFormByGroup';

jest.mock('../IntegrationTestViewByGroup', () => ({
  __esModule: true,
  default: jest.fn(() => (
    <div data-test="integration-test-view-by-group">IntegrationTestViewByGroup</div>
  )),
}));

describe('IntegrationTestCreateFormByGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render IntegrationTestViewByGroup for creating a test', () => {
    routerRenderer(<IntegrationTestCreateFormByGroup />);

    expect(screen.getByTestId('integration-test-view-by-group')).toBeInTheDocument();
    expect(screen.getByText('IntegrationTestViewByGroup')).toBeInTheDocument();
  });
});
