import { startFileJobs } from '../fileJobs.js';

describe('startFileJobs', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const logger = () => ({ error: jest.fn() });

  it('runs the worker every interval and the orphan cleanup once a day, until stopped', async () => {
    const fileDeletion = { processDue: jest.fn(async () => ({})) };
    const orphanCleanup = { run: jest.fn(async () => ({})) };
    const stop = startFileJobs({ fileDeletion, orphanCleanup, logger: logger() });

    await jest.advanceTimersByTimeAsync(3 * 60_000);
    expect(fileDeletion.processDue).toHaveBeenCalledTimes(3);
    expect(orphanCleanup.run).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(24 * 60 * 60_000);
    expect(orphanCleanup.run).toHaveBeenCalledTimes(1);

    stop();
    const calls = fileDeletion.processDue.mock.calls.length;
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(fileDeletion.processDue).toHaveBeenCalledTimes(calls);
  });

  it('skips a run while the previous one is still going, and logs failures', async () => {
    let finish;
    const fileDeletion = {
      processDue: jest
        .fn()
        .mockImplementationOnce(() => new Promise((resolve) => (finish = resolve)))
        .mockRejectedValueOnce(new Error('db down')),
    };
    const log = logger();
    const stop = startFileJobs({ fileDeletion, orphanCleanup: { run: jest.fn() }, logger: log });

    await jest.advanceTimersByTimeAsync(3 * 60_000);
    expect(fileDeletion.processDue).toHaveBeenCalledTimes(1);

    finish();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(fileDeletion.processDue).toHaveBeenCalledTimes(2);
    expect(log.error).toHaveBeenCalledWith({ err: expect.any(Error) }, 'File deletion worker failed');
    stop();
  });
});
