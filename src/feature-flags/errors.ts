/**
 * Http error for feature flag route guards.
 *
 * Usage: throw HttpError.fromCode(404)
 */
export class HttpError extends Error {
  private static messages: { [code: number]: string } = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  };

  public constructor(
    message: string,
    public code?: number,
    public response?: Response,
  ) {
    super(message);
    Object.defineProperty(this, 'name', {
      value: new.target.name,
      configurable: true,
    });
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }

  public static fromCode(code: number) {
    return new HttpError(HttpError.messages[code], code);
  }
}
