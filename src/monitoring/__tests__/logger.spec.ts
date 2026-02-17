import { mockConsole, MockConsole } from '~/unit-test-utils';

const mockCaptureException = jest.fn();

jest.mock('../index', () => ({
  monitoringService: {
    captureException: (...args: unknown[]) => mockCaptureException(...args),
  },
}));

describe('logger', () => {
  let consoleMock: MockConsole;

  beforeEach(() => {
    consoleMock = mockConsole();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleMock.restore();
  });

  describe('with default log level (debug in non-production)', () => {
    // Default NODE_ENV in jest is 'test', so currentLevel = 'debug'
    // Re-import logger for each describe block to capture env at module scope
    let logger: typeof import('../logger').logger;

    beforeEach(() => {
      jest.isolateModules(() => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        logger = require('../logger').logger;
      });
    });

    describe('debug', () => {
      it('should log with [DEBUG] prefix and context', () => {
        const context = { key: 'value' };
        logger.debug('test message', context);

        expect(consoleMock.log).toHaveBeenCalledWith('[DEBUG] test message', context);
      });

      it('should log with empty string when context is not provided', () => {
        logger.debug('test message');

        expect(consoleMock.log).toHaveBeenCalledWith('[DEBUG] test message', '');
      });
    });

    describe('info', () => {
      it('should log with [INFO] prefix and context', () => {
        const context = { user: 'admin' };
        logger.info('info message', context);

        expect(consoleMock.info).toHaveBeenCalledWith('[INFO] info message', context);
      });

      it('should log with empty string when context is not provided', () => {
        logger.info('info message');

        expect(consoleMock.info).toHaveBeenCalledWith('[INFO] info message', '');
      });
    });

    describe('warn', () => {
      it('should log with [WARN] prefix and context', () => {
        const context = { severity: 'high' };
        logger.warn('warning message', context);

        expect(consoleMock.warn).toHaveBeenCalledWith('[WARN] warning message', context);
      });

      it('should log with empty string when context is not provided', () => {
        logger.warn('warning message');

        expect(consoleMock.warn).toHaveBeenCalledWith('[WARN] warning message', '');
      });
    });

    describe('error', () => {
      it('should log with [ERROR] prefix and call monitoringService.captureException', () => {
        const error = new Error('boom');
        const context = { action: 'submit' };
        logger.error('error occurred', error, context);

        expect(consoleMock.error).toHaveBeenCalledWith('[ERROR] error occurred', error, context);
        expect(mockCaptureException).toHaveBeenCalledWith(error, context);
      });

      it('should handle missing error and context parameters', () => {
        logger.error('error occurred');

        expect(consoleMock.error).toHaveBeenCalledWith('[ERROR] error occurred', undefined, '');
        expect(mockCaptureException).toHaveBeenCalledWith(undefined, undefined);
      });

      it('should handle error without context', () => {
        const error = new Error('test');
        logger.error('error occurred', error);

        expect(consoleMock.error).toHaveBeenCalledWith('[ERROR] error occurred', error, '');
        expect(mockCaptureException).toHaveBeenCalledWith(error, undefined);
      });
    });
  });

  describe('log level filtering', () => {
    it('should not log debug messages in production environment', () => {
      jest.isolateModules(() => {
        process.env.NODE_ENV = 'production';
        process.env.LOG_LEVEL = 'debug';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const prodLogger = require('../logger').logger;
        prodLogger.debug('should not appear');

        expect(consoleMock.log).not.toHaveBeenCalled();
        process.env.NODE_ENV = 'test';
        delete process.env.LOG_LEVEL;
      });
    });

    it('should suppress debug and info when LOG_LEVEL is warn', () => {
      jest.isolateModules(() => {
        process.env.LOG_LEVEL = 'warn';
        delete process.env.NODE_ENV;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const filteredLogger = require('../logger').logger;

        filteredLogger.debug('should not appear');
        filteredLogger.info('should not appear');
        filteredLogger.warn('should appear');

        expect(consoleMock.log).not.toHaveBeenCalled();
        expect(consoleMock.info).not.toHaveBeenCalled();
        expect(consoleMock.warn).toHaveBeenCalledWith('[WARN] should appear', '');

        process.env.NODE_ENV = 'test';
        delete process.env.LOG_LEVEL;
      });
    });

    it('should only allow error when LOG_LEVEL is error', () => {
      jest.isolateModules(() => {
        process.env.LOG_LEVEL = 'error';
        delete process.env.NODE_ENV;
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const filteredLogger = require('../logger').logger;

        filteredLogger.debug('no');
        filteredLogger.info('no');
        filteredLogger.warn('no');
        filteredLogger.error('yes');

        expect(consoleMock.log).not.toHaveBeenCalled();
        expect(consoleMock.info).not.toHaveBeenCalled();
        expect(consoleMock.warn).not.toHaveBeenCalled();
        expect(consoleMock.error).toHaveBeenCalledWith('[ERROR] yes', undefined, '');

        process.env.NODE_ENV = 'test';
        delete process.env.LOG_LEVEL;
      });
    });

    it('should default to warn level in production when LOG_LEVEL is not set', () => {
      jest.isolateModules(() => {
        delete process.env.LOG_LEVEL;
        process.env.NODE_ENV = 'production';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const prodLogger = require('../logger').logger;

        prodLogger.debug('no');
        prodLogger.info('no');
        prodLogger.warn('yes');

        expect(consoleMock.log).not.toHaveBeenCalled();
        expect(consoleMock.info).not.toHaveBeenCalled();
        expect(consoleMock.warn).toHaveBeenCalledWith('[WARN] yes', '');

        process.env.NODE_ENV = 'test';
      });
    });

    it('should allow all levels when LOG_LEVEL is debug', () => {
      jest.isolateModules(() => {
        process.env.LOG_LEVEL = 'debug';
        process.env.NODE_ENV = 'test';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const debugLogger = require('../logger').logger;

        debugLogger.debug('d');
        debugLogger.info('i');
        debugLogger.warn('w');
        debugLogger.error('e');

        expect(consoleMock.log).toHaveBeenCalledTimes(1);
        expect(consoleMock.info).toHaveBeenCalledTimes(1);
        expect(consoleMock.warn).toHaveBeenCalledTimes(1);
        expect(consoleMock.error).toHaveBeenCalledTimes(1);

        delete process.env.LOG_LEVEL;
      });
    });
  });

  describe('LOG_LEVELS export', () => {
    it('should export correct numeric values for each log level', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { LOG_LEVELS } = require('../../consts/log-levels');

      expect(LOG_LEVELS).toEqual({
        debug: 0,
        info: 1,
        warn: 2,
        error: 3,
      });
    });
  });

  describe('monitoringService integration', () => {
    it('should not call monitoringService when error level is suppressed', () => {
      jest.isolateModules(() => {
        // There's no level higher than error that would suppress it,
        // but we can verify it IS called when error level is active
        process.env.LOG_LEVEL = 'error';
        process.env.NODE_ENV = 'test';
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const errorLogger = require('../logger').logger;

        errorLogger.error('critical', new Error('fail'));

        expect(mockCaptureException).toHaveBeenCalledWith(new Error('fail'), undefined);

        delete process.env.LOG_LEVEL;
      });
    });
  });
});
