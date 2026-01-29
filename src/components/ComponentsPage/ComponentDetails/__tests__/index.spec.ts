import { k8sQueryGetResource } from '../../../../k8s';
import { ComponentModel } from '../../../../models';
import { RouterParams } from '../../../../routes/utils';
import {
  componentDetailsViewLoader,
  ComponentDetailsTab,
  ComponentDetailsViewLayout,
} from '../index';

jest.mock('../../../../k8s', () => ({
  k8sQueryGetResource: jest.fn(),
}));

jest.mock('../../../../utils/rbac', () => ({
  createLoaderWithAccessCheck: jest.fn((loader) => loader),
}));

jest.mock('../ComponentDetailsView', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../../../Components/ComponentDetails/tabs/ComponentDetailsTab', () => ({
  __esModule: true,
  default: () => null,
}));

const k8sQueryGetResourceMock = k8sQueryGetResource as jest.Mock;

describe('ComponentDetails index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should export layout and tab components', () => {
    expect(ComponentDetailsViewLayout).toBeDefined();
    expect(ComponentDetailsTab).toBeDefined();
  });

  it('should call k8sQueryGetResource in loader', async () => {
    k8sQueryGetResourceMock.mockResolvedValue({ metadata: { name: 'my-component' } });

    await componentDetailsViewLoader({
      params: {
        [RouterParams.workspaceName]: 'test-ns',
        [RouterParams.componentName]: 'my-component',
      },
      request: undefined,
    });

    expect(k8sQueryGetResourceMock).toHaveBeenCalledWith({
      model: ComponentModel,
      queryOptions: {
        ns: 'test-ns',
        name: 'my-component',
      },
    });
  });

  it('should propagate loader errors', async () => {
    k8sQueryGetResourceMock.mockRejectedValue(new Error('Error'));

    await expect(
      componentDetailsViewLoader({
        params: {
          [RouterParams.workspaceName]: 'test-ns',
          [RouterParams.componentName]: 'my-component',
        },
        request: undefined,
      }),
    ).rejects.toThrow('Error');
  });
});
