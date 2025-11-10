import { renderHook } from '@testing-library/react-hooks';
import { mockUseNamespaceHook, mockAccessReviewUtilImplementation } from '~/unit-test-utils';
import { useWhatsNextItems } from '../useWhatsNextItems';

// Mock useApplicationUrl from its correct module
const mockUseApplicationUrl = jest.fn();
jest.mock('../../../hooks/useUIInstance', () => ({
  useApplicationUrl: () => mockUseApplicationUrl(),
}));
const mockUseNamespace = mockUseNamespaceHook('test-namespace');
const mockUseAccessReviewForModel = mockAccessReviewUtilImplementation('useAccessReviewForModel');

jest.mock('../../CustomizedPipeline/CustomizePipelinesModal', () => ({
  createCustomizeAllPipelinesModalLauncher: jest.fn(),
}));

jest.mock('../../modal/ModalProvider', () => ({
  useModalLauncher: jest.fn(),
}));

const { createCustomizeAllPipelinesModalLauncher: mockCreateCustomizeAllPipelinesModalLauncher } =
  jest.requireMock('../../CustomizedPipeline/CustomizePipelinesModal');
const { useModalLauncher: mockUseModalLauncher } = jest.requireMock('../../modal/ModalProvider');

describe('useWhatsNextItems', () => {
  const mockShowModal = jest.fn();
  const mockModalLauncher = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseApplicationUrl.mockReturnValue('https://github.com/apps/test-app');
    mockUseNamespace.mockReturnValue('test-namespace');
    mockUseModalLauncher.mockReturnValue(mockShowModal);
    mockCreateCustomizeAllPipelinesModalLauncher.mockReturnValue(mockModalLauncher);

    // Default access permissions
    mockUseAccessReviewForModel.mockImplementation((_, action) => {
      if (action === 'create') return [true, false]; // Can create components, integration tests, release plans
      if (action === 'patch') return [true, false]; // Can patch components
      return [false, false];
    });
  });

  it('should return whats next items with correct structure', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    expect(items).toHaveLength(7);
    expect(items[0]).toMatchObject({
      id: 0,
      title: 'Grow your application',
      description: 'Grow your application by adding components.',
      cta: expect.objectContaining({
        label: 'Add component',
        href: expect.stringContaining('/ns/test-namespace/import?application=test-app'),
        disabled: false,
        testId: 'add-component',
      }),
    });
  });

  it('should disable add component when user lacks create permission', () => {
    mockUseAccessReviewForModel.mockImplementation((model, action) => {
      if (model.kind === 'Component' && action === 'create') return [false, false];
      return [true, false];
    });

    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    expect(items[0].cta.disabled).toBe(true);
    expect(items[0].cta.disabledTooltip).toBe("You don't have access to add a component");
  });

  it('should disable add integration test when user lacks create permission', () => {
    mockUseAccessReviewForModel.mockImplementation((model, action) => {
      if (model.kind === 'IntegrationTestScenario' && action === 'create') return [false, false];
      return [true, false];
    });

    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    expect(items[1].cta.disabled).toBe(true);
    expect(items[1].cta.disabledTooltip).toBe("You don't have access to add an integration test");
  });

  it('should disable create release plan when user lacks create permission', () => {
    mockUseAccessReviewForModel.mockImplementation((model, action) => {
      if (model.kind === 'ReleasePlan' && action === 'create') return [false, false];
      return [true, false];
    });

    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    expect(items[2].cta.disabled).toBe(true);
    expect(items[2].cta.disabledTooltip).toBe("You don't have access to create a release plan");
  });

  it('should disable manage build pipelines when user lacks patch permission', () => {
    mockUseAccessReviewForModel.mockImplementation((model, action) => {
      if (model.kind === 'Component' && action === 'patch') return [false, false];
      return [true, false];
    });

    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    expect(items[6].cta.disabled).toBe(true);
    expect(items[6].cta.disabledTooltip).toBe("You don't have access to manage build pipelines");
  });

  it('should include analytics data for all CTAs', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    const itemsWithAnalytics = items.filter((item) => item.cta?.analytics);

    itemsWithAnalytics.forEach((item) => {
      expect(item.cta.analytics).toMatchObject({
        link_location: 'whats-next',
        app_name: 'test-app',
        namespace: 'test-namespace',
      });
    });
  });

  it('should call modal launcher for manage build pipelines', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    const managePipelinesItem = items[6];
    managePipelinesItem.cta.onClick();

    expect(mockCreateCustomizeAllPipelinesModalLauncher).toHaveBeenCalledWith(
      'test-app',
      'test-namespace',
    );
    expect(mockShowModal).toHaveBeenCalledWith(mockModalLauncher);
  });

  it('should include external link for GitHub app installation', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    const githubAppItem = items[3];
    expect(githubAppItem.cta.external).toBe(true);
    expect(githubAppItem.cta.href).toBe('https://github.com/apps/test-app');
  });

  it('should include GitLab app item with no action', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    const gitlabAppItem = items[4];
    expect(gitlabAppItem.noAction).toBe(true);
    expect(gitlabAppItem.helpText).toBe('Learn more about installing GitLab app');
    expect(gitlabAppItem.cta).toBeUndefined();
  });

  it('should use correct URLs for different actions', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    expect(items[0].cta.href).toContain('/import?application=test-app');
    expect(items[1].cta.href).toContain('/integrationtests/add');
    expect(items[2].cta.href).toContain('/release-plan/create');
    expect(items[5].cta.href).toContain('/activity');
  });

  it('should include help links for all items', () => {
    const { result } = renderHook(() => useWhatsNextItems('test-app'));
    const items = result.current;

    items.forEach((item) => {
      expect(item.helpLink).toMatch(/^https:\/\/konflux-ci\.dev/);
    });
  });
});
