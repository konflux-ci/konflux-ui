import pLimit from 'p-limit';

const DEFAULT_MAX_CONCURRENCY = 10;
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_INTERVAL = 500;

/**
 * To check whether the error is a temp error then retry or not
 *
 * @param error - error object
 * @returns whether it is a error that retry can reslove
 */
const isTemporaryError = (error: unknown): boolean => {
  const TEMPORARY_HTTP_STATUS_CODES = [503, 500, 429, 504];

  // Handle Kubernetes Status object
  if (
    typeof error === 'object' &&
    error !== null &&
    'kind' in error &&
    (error as { kind: string }).kind === 'Status'
  ) {
    const status = error as unknown as { code: number; reason?: string };
    return (
      TEMPORARY_HTTP_STATUS_CODES.includes(status.code) ||
      status.reason?.toLowerCase() === 'timeout'
    );
  }

  // Handle Response objects (e.g., from fetch)
  if (error instanceof Response) {
    const httpStatus = error.status;
    return TEMPORARY_HTTP_STATUS_CODES.includes(httpStatus);
  }

  // Handle generic Error objects
  if (error instanceof Error) {
    return /timeout/i.test(error.message);
  }

  // Default case: not a temporary error
  return false;
};

/**
 *  retry async function
 *
 *  We do not export it out, because we just would like the batch
 *  action enjoy its.
 *  We assume the signle request is stable enough, so we do not need
 *  retry.
 *
 * @param action - aync function
 * @param maxRetries
 * @param retryInterval
 * @returns return values of async function
 */
const withRetry = async <T>(
  action: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  retryInterval: number = DEFAULT_RETRY_INTERVAL,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await action();
    } catch (error) {
      lastError = error;
      const isRetryable = isTemporaryError(error);
      if (!isRetryable || attempt === maxRetries) {
        throw lastError;
      }

      const delay = retryInterval * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * let us process data in batch to avoid potential performance issue
 *
 * @param items - data to be processed
 * @param maxConcurrency - how many items processed at the same time
 * @param processor - the process function
 * @param args - other parameters for the process function
 * @returns all fulfilled jobs
 * @throws all failed errors
 */

export const processWithPLimit = async <T, A extends unknown[], R>(
  items: T[],
  maxConcurrency: number,
  processor: (item: T, ...args: A) => Promise<R>,
  ...args: A
): Promise<Awaited<R>[]> => {
  const limit =
    maxConcurrency > DEFAULT_MAX_CONCURRENCY
      ? pLimit(DEFAULT_MAX_CONCURRENCY)
      : pLimit(maxConcurrency);

  const results = await Promise.allSettled(
    items.map((item) =>
      limit(() =>
        withRetry(() => processor(item, ...args)).catch((err) => {
          return Promise.reject({
            item,
            error: err,
          });
        }),
      ),
    ),
  );

  const fulfilledResults = results
    .filter((r): r is PromiseFulfilledResult<Awaited<R>> => r.status === 'fulfilled')
    .map((r) => r.value);

  const errors = results.filter((r) => r.status === 'rejected').map((r) => r.reason);

  if (errors.length > 0) {
    throw errors; // throw errors for all failed jobs
  }

  return fulfilledResults;
};
