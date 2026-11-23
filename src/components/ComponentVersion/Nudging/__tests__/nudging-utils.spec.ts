import { mockNudgeConfig } from '../__data__/mock-nudge-config';
import { getIncomingNudges, getNudgeMode, getOutgoingNudges } from '../nudging-utils';

describe('getOutgoingNudges', () => {
  it('filters entries where from matches the component', () => {
    expect(getOutgoingNudges(mockNudgeConfig, 'app1')).toEqual([{ from: 'app1', to: 'app2' }]);
  });

  it('returns an empty array when nothing matches', () => {
    expect(getOutgoingNudges(mockNudgeConfig, 'unknown-component')).toEqual([]);
  });

  it('returns an empty array for a null NudgeConfig', () => {
    expect(getOutgoingNudges(null, 'app1')).toEqual([]);
  });
});

describe('getIncomingNudges', () => {
  it('filters entries where to matches the component', () => {
    expect(getIncomingNudges(mockNudgeConfig, 'app2')).toEqual([{ from: 'app1', to: 'app2' }]);
  });

  it('returns an empty array for a null NudgeConfig', () => {
    expect(getIncomingNudges(null, 'app2')).toEqual([]);
  });
});

describe('getNudgeMode', () => {
  it('returns the explicit mode when set', () => {
    expect(getNudgeMode({ from: 'a', to: 'b', mode: 'validated' })).toBe('validated');
  });

  it('defaults to immediate when mode is omitted', () => {
    expect(getNudgeMode({ from: 'a', to: 'b' })).toBe('immediate');
  });
});
