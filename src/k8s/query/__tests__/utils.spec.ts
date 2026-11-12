import { K8sResourceCommon } from '../../../types/k8s';
import {
  createGetQueryOptions,
  createListqueryOptions,
  createQueryKeys,
  hashQueryKeys,
} from '../utils';

jest.mock('../../k8s-fetch', () => ({
  K8sGetResource: jest.fn(() => Promise.resolve({ metadata: { name: 'mock-resource' } })),
  K8sListResourceItems: jest.fn(() =>
    Promise.resolve([{ metadata: { name: 'item-1' } }, { metadata: { name: 'item-2' } }]),
  ),
}));

const minimalModel = {
  apiGroup: 'tekton.dev',
  apiVersion: 'v1',
  kind: 'PipelineRun',
  plural: 'pipelineruns',
};

describe('createQueryKeys', () => {
  it('should return baseline key with model only (no queryOptions)', () => {
    const key = createQueryKeys({ model: minimalModel });

    expect(key).toEqual([
      undefined,
      {
        group: 'tekton.dev',
        version: 'v1',
        kind: 'PipelineRun',
      },
    ]);
  });

  it('should include idKey when queryOptions.name is set', () => {
    const key = createQueryKeys({
      model: minimalModel,
      queryOptions: { name: 'foo', queryParams: {} },
    });

    expect(key).toContainEqual({ metadata: { name: 'foo' } });
    const idKeyEntry = key.find((x) => typeof x === 'object' && x !== null && 'metadata' in x);
    expect(idKeyEntry).toEqual({ metadata: { name: 'foo' } });
  });

  it('should include selector when queryParams.labelSelector is set', () => {
    const labelSelector = { matchLabels: { x: 'y' } };
    const key = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'my-ns', queryParams: { labelSelector } },
    });

    expect(key).toContainEqual(labelSelector);
  });

  it('should include filterParams with only name in queryParams', () => {
    const key = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'my-ns', queryParams: { name: 'bar' } },
    });

    expect(key).toContainEqual({ name: 'bar', creationTimestampAfter: undefined });
  });

  it('should include filterParams with only creationTimestampAfter in queryParams', () => {
    const key = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'my-ns', queryParams: { creationTimestampAfter: '123' } },
    });

    expect(key).toContainEqual({ name: undefined, creationTimestampAfter: '123' });
  });

  it('should include filterParams with both name and creationTimestampAfter in queryParams', () => {
    const key = createQueryKeys({
      model: minimalModel,
      queryOptions: {
        ns: 'my-ns',
        queryParams: { name: 'baz', creationTimestampAfter: '456' },
      },
    });

    expect(key).toContainEqual({ name: 'baz', creationTimestampAfter: '456' });
  });

  it('should not add filterParams when queryParams has neither name nor creationTimestampAfter', () => {
    const key = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'my-ns', queryParams: {} },
    });

    const hasFilterParamEntry = key.some(
      (x) =>
        typeof x === 'object' &&
        x !== null &&
        'name' in x &&
        'creationTimestampAfter' in x &&
        !('metadata' in x),
    );
    expect(hasFilterParamEntry).toBe(false);
  });

  it('should include prefix as first element when provided', () => {
    const key = createQueryKeys({
      model: minimalModel,
      prefix: 'kubearchive',
    });

    expect(key[0]).toBe('kubearchive');
  });

  it('should include pathSuffix from fetchOptions in the key for sub-resource differentiation', () => {
    const keyWithSuffix = createQueryKeys({
      model: minimalModel,
      queryOptions: { name: 'my-queue', queryParams: {} },
      fetchOptions: { requestInit: { pathSuffix: 'pendingworkloads' } },
    });
    const keyWithoutSuffix = createQueryKeys({
      model: minimalModel,
      queryOptions: { name: 'my-queue', queryParams: {} },
    });

    expect(keyWithSuffix).toContainEqual('pendingworkloads');
    expect(keyWithoutSuffix).not.toContainEqual('pendingworkloads');
  });
});

describe('hashQueryKeys', () => {
  it('should produce different hashes for keys that differ only by filterParams', () => {
    const keyA = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'ns', queryParams: { name: 'a' } },
    });
    const keyB = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'ns', queryParams: { name: 'b' } },
    });

    expect(hashQueryKeys(keyA)).not.toBe(hashQueryKeys(keyB));
  });

  it('should produce the same hash for keys with same filterParams', () => {
    const keyA = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'ns', queryParams: { name: 'x', creationTimestampAfter: '123' } },
    });
    const keyB = createQueryKeys({
      model: minimalModel,
      queryOptions: { ns: 'ns', queryParams: { name: 'x', creationTimestampAfter: '123' } },
    });

    expect(hashQueryKeys(keyA)).toBe(hashQueryKeys(keyB));
  });
});

const minimalArgs = {
  model: minimalModel,
  queryOptions: { ns: 'test-ns', queryParams: {} },
};

describe('createGetQueryOptions', () => {
  it('should use default queryKey and queryFn when none are provided', () => {
    const result = createGetQueryOptions<K8sResourceCommon>(minimalArgs);

    expect(result.queryKey).toBeDefined();
    expect(result.queryFn).toBeDefined();
    // Default queryKey should match createQueryKeys output
    expect(result.queryKey).toEqual(createQueryKeys({ ...minimalArgs, prefix: undefined }));
  });

  it('should use custom queryKey when provided', () => {
    const customKey = ['custom', 'key'];
    const result = createGetQueryOptions<K8sResourceCommon>(minimalArgs, {
      queryKey: customKey,
    });

    expect(result.queryKey).toEqual(customKey);
  });

  it('should use custom queryFn when provided', () => {
    const customFn = jest.fn(() =>
      Promise.resolve({ metadata: { name: 'custom' } } as K8sResourceCommon),
    );
    const result = createGetQueryOptions<K8sResourceCommon>(minimalArgs, {
      queryFn: customFn,
    });

    expect(result.queryFn).toBe(customFn);
  });

  it('should pass through additional options', () => {
    const result = createGetQueryOptions<K8sResourceCommon>(minimalArgs, {
      enabled: false,
      staleTime: 5000,
    });

    expect(result.enabled).toBe(false);
    expect(result.staleTime).toBe(5000);
  });
});

describe('createListqueryOptions', () => {
  it('should use default queryKey and queryFn when none are provided', () => {
    const result = createListqueryOptions<K8sResourceCommon[]>(minimalArgs);

    expect(result.queryKey).toBeDefined();
    expect(result.queryFn).toBeDefined();
    expect(result.queryKey).toEqual(createQueryKeys({ ...minimalArgs, prefix: undefined }));
  });

  it('should use custom queryKey when provided', () => {
    const customKey = ['custom', 'list', 'key'];
    const result = createListqueryOptions<K8sResourceCommon[]>(minimalArgs, {
      queryKey: customKey,
    });

    expect(result.queryKey).toEqual(customKey);
  });

  it('should use custom queryFn when provided', () => {
    const customFn = jest.fn(() => Promise.resolve([] as K8sResourceCommon[]));
    const result = createListqueryOptions<K8sResourceCommon[]>(minimalArgs, {
      queryFn: customFn,
    });

    expect(result.queryFn).toBe(customFn);
  });

  it('should pass through additional options', () => {
    const result = createListqueryOptions<K8sResourceCommon[]>(minimalArgs, {
      enabled: false,
      refetchInterval: 3000,
    });

    expect(result.enabled).toBe(false);
    expect(result.refetchInterval).toBe(3000);
  });

  it('should apply filterData to the default queryFn result', async () => {
    const filterData = jest.fn((items: K8sResourceCommon[]) =>
      items.filter((item) => item.metadata.name === 'item-1'),
    );
    const result = createListqueryOptions<K8sResourceCommon[]>(minimalArgs, {
      filterData,
    });

    const data = await (result.queryFn as () => Promise<K8sResourceCommon[]>)();
    expect(filterData).toHaveBeenCalledWith([
      { metadata: { name: 'item-1' } },
      { metadata: { name: 'item-2' } },
    ]);
    expect(data).toEqual([{ metadata: { name: 'item-1' } }]);
  });

  it('should not apply filterData when a custom queryFn is provided', async () => {
    const filterData = jest.fn((items: K8sResourceCommon[]) => items);
    const customFn = jest.fn(() =>
      Promise.resolve([{ metadata: { name: 'custom' } }] as K8sResourceCommon[]),
    );
    const result = createListqueryOptions<K8sResourceCommon[]>(minimalArgs, {
      filterData,
      queryFn: customFn,
    });

    const data = await (result.queryFn as () => Promise<K8sResourceCommon[]>)();
    expect(customFn).toHaveBeenCalled();
    expect(filterData).not.toHaveBeenCalled();
    expect(data).toEqual([{ metadata: { name: 'custom' } }]);
  });
});
