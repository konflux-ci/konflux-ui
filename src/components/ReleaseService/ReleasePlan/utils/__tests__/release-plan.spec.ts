import '@testing-library/jest-dom';
import { ReleasePlanKind } from '../../../../../types/coreBuildService';
import { mockReleasePlan } from '../../__data__/release-plan.mock';
import { isMatched } from '../release-plan';

describe('isMatched', () => {
  it('should return true when release plan has Matched condition with status True', () => {
    const releasePlan: ReleasePlanKind = {
      ...mockReleasePlan,
      status: {
        conditions: [
          {
            type: 'Matched',
            status: 'True',
          },
        ],
      },
    };

    expect(isMatched(releasePlan)).toBe(true);
  });

  it('should return false when release plan has Matched condition with status False', () => {
    const releasePlan: ReleasePlanKind = {
      ...mockReleasePlan,
      status: {
        conditions: [
          {
            type: 'Matched',
            status: 'False',
          },
        ],
      },
    };

    expect(isMatched(releasePlan)).toBe(false);
  });

  it('should return false when release plan does not have Matched condition', () => {
    const releasePlan: ReleasePlanKind = {
      ...mockReleasePlan,
      status: {
        conditions: [
          {
            type: 'OtherCondition',
            status: 'True',
          },
        ],
      },
    };

    expect(isMatched(releasePlan)).toBe(false);
  });

  it('should return false when release plan has empty conditions array', () => {
    const releasePlan: ReleasePlanKind = {
      ...mockReleasePlan,
      status: {
        conditions: [],
      },
    };

    expect(isMatched(releasePlan)).toBe(false);
  });

  it('should return false when release plan status is undefined', () => {
    expect(isMatched(mockReleasePlan)).toBe(false);
  });

  it('should return false when release plan status conditions is undefined', () => {
    const releasePlan: ReleasePlanKind = {
      ...mockReleasePlan,
      status: {},
    };

    expect(isMatched(releasePlan)).toBe(false);
  });

  it('should return true when release plan has multiple conditions including Matched with status True', () => {
    const releasePlan: ReleasePlanKind = {
      ...mockReleasePlan,
      status: {
        conditions: [
          {
            type: 'OtherCondition',
            status: 'False',
          },
          {
            type: 'Matched',
            status: 'True',
          },
          {
            type: 'AnotherCondition',
            status: 'Unknown',
          },
        ],
      },
    };

    expect(isMatched(releasePlan)).toBe(true);
  });
});
