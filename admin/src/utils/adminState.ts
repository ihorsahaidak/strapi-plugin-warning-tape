export type AdminFailure = { where: string; message: string };

const failures: AdminFailure[] = [];

/** Whatever the tape could not do in this browser, for the Settings page to show. */
export const recordFailure = (where: string, error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  if (failures.some((failure) => failure.where === where && failure.message === message)) return;
  failures.push({ where, message });
  // eslint-disable-next-line no-console
  console.warn(`[warning-tape] ${where}: ${message}`);
};

export const readFailures = (): AdminFailure[] => [...failures];

/** Runs `task`, swallowing anything it throws — nothing here is worth a broken admin. */
export const guard = <T,>(where: string, task: () => T): T | undefined => {
  try {
    return task();
  } catch (error) {
    recordFailure(where, error);
    return undefined;
  }
};
