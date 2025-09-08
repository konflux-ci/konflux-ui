import { ComponentRelationNudgeType } from '../type';
import {
  componentRelationValidationSchema,
  computeNudgeDataChanges,
  transformNudgeData,
  toCustomBoolean,
} from '../utils';

describe('computeNudgeDataChanges', () => {
  it('should compute data changes', () => {
    expect(
      computeNudgeDataChanges(
        [{ source: 'a', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] }],
        [],
      ),
    ).toEqual([{ source: 'a', nudgeType: ComponentRelationNudgeType.NUDGES, target: [] }]);
    expect(
      computeNudgeDataChanges(
        [],
        [{ source: 'a', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] }],
      ),
    ).toEqual([{ source: 'a', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] }]);
    expect(
      computeNudgeDataChanges(
        [
          { source: 'a', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b'] },
          { source: 'b', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['c'] },
          { source: 'c', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['d'] },
        ],
        [{ source: 'b', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['c'] }],
      ),
    ).toEqual([
      { source: 'b', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['c'] },
      { source: 'a', nudgeType: ComponentRelationNudgeType.NUDGES, target: [] },
      { source: 'c', nudgeType: ComponentRelationNudgeType.NUDGES, target: [] },
    ]);
  });
});

describe('transformNudgeData', () => {
  it('should transform data', () => {
    expect(
      transformNudgeData([
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] },
      ]),
    ).toEqual({ abcd: ['b', 'c'] });
    expect(
      transformNudgeData([
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] },
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGED_BY, target: ['b', 'c'] },
      ]),
    ).toEqual({ abcd: ['b', 'c'], b: ['abcd'], c: ['abcd'] });
    expect(
      transformNudgeData([
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] },
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGED_BY, target: ['b', 'c'] },
        { source: 'b', nudgeType: ComponentRelationNudgeType.NUDGED_BY, target: ['abcd', 'c'] },
      ]),
    ).toEqual({ abcd: ['b', 'c'], b: ['abcd'], c: ['abcd', 'b'] });
    expect(
      transformNudgeData([
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['b', 'c'] },
        { source: 'abcd', nudgeType: ComponentRelationNudgeType.NUDGED_BY, target: ['b', 'c'] },
        { source: 'b', nudgeType: ComponentRelationNudgeType.NUDGED_BY, target: ['abcd', 'c'] },
        { source: 'c', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['abcd', 'b'] },
      ]),
    ).toEqual({ abcd: ['b', 'c'], b: ['abcd'], c: ['abcd', 'b'] });
  });
});

describe('componentRelationValidationSchema', () => {
  it('should validate yup schema', async () => {
    const values = {
      relations: [
        { source: 'adf', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['a'] },
        { source: 'adf', nudgeType: ComponentRelationNudgeType.NUDGED_BY, target: ['b', 'c'] },
      ],
    };
    await expect(componentRelationValidationSchema.validate(values)).resolves.toBe(values);
    await expect(
      componentRelationValidationSchema.validate({
        relations: [
          { source: 'adf', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['a'] },
          { source: 'adf', nudgeType: ComponentRelationNudgeType.NUDGES, target: ['f'] },
        ],
      }),
    ).rejects.toThrow('2 errors occurred');
    await expect(
      componentRelationValidationSchema.validate({
        relations: [],
      }),
    ).rejects.toThrowError();
    await expect(
      componentRelationValidationSchema.validate({
        relations: [{ source: 'adf', target: ['a'] }],
      }),
    ).rejects.toThrowError();
  });
});

describe('toCustomBoolean', () => {
  it('should use custom logic to convert value to boolean', () => {
    expect(toCustomBoolean([])).toBe(false);
    expect(toCustomBoolean(['a'])).toBe(true);
    expect(toCustomBoolean('a')).toBe(true);
    expect(toCustomBoolean(null)).toBe(false);
    expect(toCustomBoolean(undefined)).toBe(false);
  });
});
