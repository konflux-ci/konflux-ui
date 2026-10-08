import { componentVersionDetailsViewLoader } from '~/components/ComponentVersion';
import { k8sQueryGetResource } from '~/k8s';
import { ComponentModelV2 } from '~/models';
import { createK8sUtilMock } from '~/unit-test-utils';
import { createLoaderWithAccessCheck } from '~/utils/rbac';

jest.mock('~/utils/rbac', () => ({
  createLoaderWithAccessCheck: jest.fn((loader) => loader),
}));

jest.mock('~/components/ComponentVersion/ComponentVersionDetailsView', () => ({
  __esModule: true,
  default: () => null,
}));

const getResourceMock = createK8sUtilMock('k8sQueryGetResource');

describe('componentVersionDetailsViewLoader', () => {
  it('checks access to the new Component API', () => {
    expect(createLoaderWithAccessCheck).toHaveBeenCalledWith(expect.any(Function), {
      model: ComponentModelV2,
      verb: 'get',
    });
  });

  it('fetches the version parent from the new Component API', async () => {
    const component = { metadata: { name: 'frontend' } };
    getResourceMock.mockResolvedValue(component);
    const result = await componentVersionDetailsViewLoader({
      params: { workspaceName: 'test-ns', componentName: 'frontend' },
      request: undefined,
    });
    expect(k8sQueryGetResource).toHaveBeenCalledWith({
      model: ComponentModelV2,
      queryOptions: { ns: 'test-ns', name: 'frontend' },
    });
    expect(result).toBe(component);
  });
});
