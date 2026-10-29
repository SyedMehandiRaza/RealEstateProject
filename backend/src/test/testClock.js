// A clock that only moves when the test says so. Same shape as systemClock in utils/clock.js.
export function createTestClock(start = new Date()) {
  let current = new Date(start);
  return {
    now: () => new Date(current),
    advance(ms) {
      current = new Date(current.getTime() + ms);
    },
    set(date) {
      current = new Date(date);
    },
  };
}
