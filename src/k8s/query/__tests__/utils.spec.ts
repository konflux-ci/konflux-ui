import { createQueryKeys, hashQueryKeys } from '../utils';

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

  it('should put prefix as first element when provided', () => {
    const key = createQueryKeys({
      model: minimalModel,
      prefix: 'kubearchive',
    });

    expect(key[0]).toBe('kubearchive');
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
