const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * MINUTE_MS;

// Runs the deletion worker every minute and the orphan cleanup daily. A run is skipped while the previous
// run of the same job is still going. Returns stop(), used on shutdown.
export function startFileJobs({
  fileDeletion,
  orphanCleanup,
  logger,
  workerIntervalMs = MINUTE_MS,
  orphanIntervalMs = DAY_MS,
}) {
  const schedule = (name, run, intervalMs) => {
    let running = false;
    const timer = setInterval(async () => {
      if (running) return;
      running = true;
      try {
        await run();
      } catch (error) {
        logger.error({ err: error }, `${name} failed`);
      } finally {
        running = false;
      }
    }, intervalMs);
    timer.unref?.();
    return timer;
  };

  const timers = [
    schedule('File deletion worker', () => fileDeletion.processDue(), workerIntervalMs),
    schedule('Orphan file cleanup', () => orphanCleanup.run(), orphanIntervalMs),
  ];
  return () => timers.forEach(clearInterval);
}
