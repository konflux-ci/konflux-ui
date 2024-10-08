import { K8sStatus } from '../types/k8s';

/**
 * Base class for custom errors.
 */
export class CustomError extends Error {
  constructor(message?: string) {
    super(message);

    // Set name as constructor name, while keeping its property descriptor compatible with Error.name
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/new.target#new.target_in_constructors
    Object.defineProperty(this, 'name', {
      value: new.target.name,
      configurable: true,
    });

    // Populate stack property via Error.captureStackTrace (when available) or manually via new Error()
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
}

export class FetchError extends CustomError {
  constructor(
    message: string,
    readonly status: number,
    readonly response: Response,
  ) {
    super(message);
  }
}

/**
 * Http error
 *
 * Usage: throw HttpError.fromCode(404)
 */
export class HttpError extends CustomError {
  protected static messages: { [code: number]: string } = {
    400: 'Bad Request',
    401: 'Unauthorized',
    402: 'Payment Required',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    406: 'Not Acceptable',
    407: 'Proxy Authentication Required', // RFC 7235
    408: 'Request Timeout',
    409: 'Conflict',
    410: 'Gone',
    411: 'Length Required',
    412: 'Precondition Failed', // RFC 7232
    413: 'Payload Too Large', // RFC 7231
    414: 'URI Too Long', // RFC 7231
    415: 'Unsupported Media Type',
    416: 'Range Not Satisfiable', // RFC 7233
    417: 'Expectation Failed',
    418: "I'm a teapot", // RFC 2324
    421: 'Misdirected Request', // RFC 7540
    426: 'Upgrade Required',
    428: 'Precondition Required', // RFC 6585
    429: 'Too Many Requests', // RFC 6585
    431: 'Request Header Fields Too Large', // RFC 6585
    451: 'Unavailable For Legal Reasons', // RFC 7725
    500: 'Internal Server Error',
    501: 'Not Implemented',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
    504: 'Gateway Timeout',
    505: 'HTTP Version Not Supported',
    506: 'Variant Also Negotiates', // RFC 2295
    510: 'Not Extended', // RFC 2774
    511: 'Network Authentication Required', // RFC 6585
  };

  public constructor(
    message: string,
    public code?: number,
    public response?: Response,
    public json?: unknown,
  ) {
    super(message);
  }

  public static fromCode(code: number) {
    return new HttpError(HttpError.messages[code], code);
  }
}

export class TimeoutError extends CustomError {
  public constructor(
    public url: string,
    public ms: number,
  ) {
    super(`Call to ${url} timed out after ${ms}ms.`);
  }
}

export class RetryError extends CustomError {}

/**
 * Error class used when Kubernetes cannot handle a request.
 */
export class K8sStatusError extends CustomError {
  constructor(readonly status: K8sStatus) {
    super(status.message);
  }
}
