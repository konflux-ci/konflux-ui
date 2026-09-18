import { screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MockIntegrationTestsWithGit } from '~/components/IntegrationTests/IntegrationTestsListView/__data__/mock-integration-tests';
import { useIntegrationTestScenarioV2 } from '~/hooks/useIntegrationTestScenariosV2';
import { useModalLauncher } from '~/shared/components/modal/ModalProvider';
import { createUseParamsMock, mockUseNamespaceHook, routerRenderer } from '~/unit-test-utils';
import { IntegrationTestOverviewTabByGroup } from '../IntegrationTestOverviewTabByGroup';

jest.mock('~/hooks/useIntegrationTestScenariosV2', () => ({
  useIntegrationTestScenarioV2: jest.fn(),
}));

jest.mock('~/shared/components/modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

const useIntegrationTestScenarioV2Mock = useIntegrationTestScenarioV2 as jest.Mock;
const useModalLauncherMock = useModalLauncher as jest.Mock;
const useParamsMock = createUseParamsMock();
mockUseNamespaceHook('test-ns');

describe('IntegrationTestOverviewTabByGroup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useModalLauncherMock.mockReturnValue(jest.fn());
    useParamsMock.mockReturnValue({
      groupName: 'test-group',
      integrationTestName: 'group-test-1',
    });
    useIntegrationTestScenarioV2Mock.mockReturnValue([
      MockIntegrationTestsWithGit[0],
      true,
      undefined,
    ]);
  });

  it('should fetch the integration test for the group from the route', () => {
    routerRenderer(<IntegrationTestOverviewTabByGroup />);
    expect(useIntegrationTestScenarioV2Mock).toHaveBeenCalledWith(
      'test-ns',
      'test-group',
      'group-test-1',
    );
  });

  it('should render the component group context link', () => {
    routerRenderer(<IntegrationTestOverviewTabByGroup />);
    screen.getByText('Component Group');
    expect(screen.getByRole('link', { name: 'test-group' })).toHaveAttribute(
      'href',
      '/ns/test-ns/groups/test-group',
    );
  });

  it('should show error state when the test cannot be loaded', () => {
    useIntegrationTestScenarioV2Mock.mockReturnValue([null, true, { code: 404 }]);
    routerRenderer(<IntegrationTestOverviewTabByGroup />);
    screen.getByText('404: Page not found');
  });
});
