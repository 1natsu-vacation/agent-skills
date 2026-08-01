const MAX_ATTEMPTS = Number(process.env.JOB_MAX_ATTEMPTS ?? 5);
const BASE_DELAY_MS = Number(process.env.JOB_RETRY_BASE_DELAY_MS ?? 1000);

export type Job = {
  id: string;
  payload: unknown;
  attempts: number;
};

// 待ち時間の上限は 60 秒 — これを超えると復旧後の再開が遅れる。
// See the incident report for background — the retry storm hit the payment provider.
function nextDelayMs(attempts: number): number {
  const exponential = BASE_DELAY_MS * 2 ** (attempts - 1);
  const jitter = Math.random() * BASE_DELAY_MS;
  return Math.min(exponential + jitter, 60_000);
}

export async function runJob(
  job: Job,
  handler: (payload: unknown) => Promise<void>,
  requeue: (job: Job, delayMs: number) => Promise<void>,
  moveToDeadLetter: (job: Job) => Promise<void>,
): Promise<void> {
  try {
    await handler(job.payload);
  } catch (error) {
    const attempts = job.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await moveToDeadLetter({ ...job, attempts });
      return;
    }
    await requeue({ ...job, attempts }, nextDelayMs(attempts));
  }
}
