import { type ComponentConformaResult } from '~/types/conforma';
import { aggregateCounts } from '../conforma-fetch-utils';

const mockComponents: ComponentConformaResult[] = [
  {
    containerImage: 'quay.io/test/img',
    name: 'comp-a',
    success: false,
    violations: [{ metadata: { title: 'v1', description: '', collections: [], code: 'c1' }, msg: 'v1' }],
    warnings: [
      { metadata: { title: 'w1', description: '', collections: [], code: 'w1' }, msg: 'w1' },
      { metadata: { title: 'w2', description: '', collections: [], code: 'w2' }, msg: 'w2' },
    ],
    successes: [{ metadata: { title: 's1', description: '', collections: [], code: 's1' }, msg: 's1' }],
  },
];

describe('aggregateCounts', () => {
  it('sums violations, warnings and successes across components', () => {
    const result = aggregateCounts(mockComponents);
    expect(result).toEqual({ violationCount: 1, warningCount: 2, successCount: 1 });
  });

  it('treats missing violation/warning/success arrays as zero', () => {
    const bare: ComponentConformaResult[] = [
      { containerImage: 'img', name: 'c', success: true },
    ];
    expect(aggregateCounts(bare)).toEqual({ violationCount: 0, warningCount: 0, successCount: 0 });
  });

  it('returns all zeros for an empty component list', () => {
    expect(aggregateCounts([])).toEqual({ violationCount: 0, warningCount: 0, successCount: 0 });
  });

  it('accumulates counts across multiple components', () => {
    const two: ComponentConformaResult[] = [
      {
        containerImage: 'img1',
        name: 'a',
        success: false,
        violations: [{ metadata: { title: '', description: '', collections: [], code: '' }, msg: '' }],
      },
      {
        containerImage: 'img2',
        name: 'b',
        success: false,
        violations: [
          { metadata: { title: '', description: '', collections: [], code: '' }, msg: '' },
          { metadata: { title: '', description: '', collections: [], code: '' }, msg: '' },
        ],
      },
    ];
    expect(aggregateCounts(two).violationCount).toBe(3);
  });
});
