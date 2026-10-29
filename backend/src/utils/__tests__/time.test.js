import { toWholeSeconds } from '../time.js';

describe('toWholeSeconds', () => {
  it('drops the milliseconds, as a DATETIME column does', () => {
    expect(toWholeSeconds(new Date('2026-10-29T10:00:00.999Z'))).toEqual(
      new Date('2026-10-29T10:00:00.000Z'),
    );
  });

  it('keeps a time that is already a whole second', () => {
    expect(toWholeSeconds(new Date('2026-10-29T10:00:05.000Z'))).toEqual(
      new Date('2026-10-29T10:00:05.000Z'),
    );
  });

  it('rounds down, never up', () => {
    expect(toWholeSeconds(new Date('2026-10-29T10:00:59.500Z'))).toEqual(
      new Date('2026-10-29T10:00:59.000Z'),
    );
  });

  it('returns a new Date and leaves the argument alone', () => {
    const date = new Date('2026-10-29T10:00:00.250Z');
    expect(toWholeSeconds(date)).not.toBe(date);
    expect(date.getMilliseconds()).toBe(250);
  });
});
