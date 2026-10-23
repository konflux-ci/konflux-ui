import { ComponentKind, ComponentVersion } from '~/types';
import { getComponentVersion } from '~/utils/version-utils';

const mockVersions: ComponentVersion[] = [
  { name: 'Version 1.0', revision: 'ver-1.0', context: './frontend' },
  { name: 'Main', revision: 'main' },
  { name: 'Feature branch', revision: 'feature/my-branch', context: './backend' },
];

const mockComponent = {
  metadata: { name: 'test-comp', namespace: 'test-ns', uid: 'uid', creationTimestamp: '' },
  spec: {
    source: {
      url: 'https://github.com/org/repo',
      versions: mockVersions,
    },
    containerImage: 'quay.io/org/repo',
  },
} as unknown as ComponentKind;

describe('getComponentVersion', () => {
  it('should return the version matching the given name', () => {
    const result = getComponentVersion(mockComponent, 'Version 1.0');
    expect(result).toEqual(mockVersions[0]);
  });

  it('should return the named version whose Git revision contains slashes', () => {
    const result = getComponentVersion(mockComponent, 'Feature branch');
    expect(result).toEqual(mockVersions[2]);
  });

  it('should not match a Git revision instead of a version name', () => {
    expect(getComponentVersion(mockComponent, 'ver-1.0')).toBeUndefined();
  });

  it('should return undefined when no version matches', () => {
    const result = getComponentVersion(mockComponent, 'nonexistent');
    expect(result).toBeUndefined();
  });

  it('should return undefined when component has no versions', () => {
    const componentNoVersions = {
      ...mockComponent,
      spec: { ...mockComponent.spec, source: { url: 'https://github.com/org/repo' } },
    } as unknown as ComponentKind;
    const result = getComponentVersion(componentNoVersions, 'main');
    expect(result).toBeUndefined();
  });

  it('should return undefined when source is undefined', () => {
    const componentNoSource = {
      ...mockComponent,
      spec: { ...mockComponent.spec, source: undefined },
    } as unknown as ComponentKind;
    const result = getComponentVersion(componentNoSource, 'main');
    expect(result).toBeUndefined();
  });
});
