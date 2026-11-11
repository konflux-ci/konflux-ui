import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('mochawesome/addContext', () => jest.fn(), { virtual: true });

const body = {
  find: () => ({ length: 0 }),
  is: () => false,
  text: () => '',
};

const command = {
  and: jest.fn().mockReturnThis(),
  clear: jest.fn().mockReturnThis(),
  click: jest.fn().mockReturnThis(),
  contains: jest.fn().mockReturnThis(),
  first: jest.fn().mockReturnThis(),
  scrollIntoView: jest.fn().mockReturnThis(),
  should: jest.fn().mockReturnThis(),
  then: jest.fn((callback: (subject: typeof body) => void) => callback(body)),
  type: jest.fn().mockReturnThis(),
};

const credentials = {
  then: (callback: (value: { USERNAME: string; PASSWORD: string }) => void) =>
    callback({ USERNAME: 'test-user', PASSWORD: 'test-password' }),
};

const cy = {
  contains: jest.fn(() => command),
  env: jest.fn<(keys: string[]) => typeof credentials>(() => credentials),
  exec: jest.fn(() => {
    throw new Error('Login support tests must not execute cluster commands');
  }),
  get: jest.fn<(selector: string, options?: unknown) => typeof command>(() => command),
  location: jest.fn(() => command),
  setCookie: jest.fn(),
  testA11y: jest.fn(),
  visit: jest.fn(),
};

function runLoginHook(values: Record<string, string | boolean> = {}) {
  const env: Record<string, string | boolean> = {
    KONFLUX_BASE_URL: 'https://localhost:8080',
    HAC_NAMESPACE: 'default-tenant',
    LOCAL_CLUSTER: false,
    LOGIN_PROVIDER: '',
    PERIODIC_RUN_STAGE: false,
    STUDIO_MODE: false,
    CLEAN_NAMESPACE: 'false',
    ...values,
  };
  let beforeHook: () => void;
  Object.assign(globalThis, {
    Cypress: { expose: (key: string) => env[key], on: jest.fn() },
    cy,
    before: (callback: () => void) => {
      beforeHook = callback;
    },
    after: jest.fn(),
    afterEach: jest.fn(),
    localStorage: { setItem: jest.fn() },
  });
  jest.isolateModules(() => {
    require('../hooks');
  });
  beforeHook();
}

describe('Cypress login provider selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([{ LOCAL_CLUSTER: true }, { PERIODIC_RUN_STAGE: true }, {}])(
    'uses the authenticated CLI session with %j',
    (values) => {
      runLoginHook({ ...values, LOGIN_PROVIDER: 'cli' });

      expect(cy.env).not.toHaveBeenCalled();
      expect(cy.visit).toHaveBeenCalledWith('https://localhost:8080');
      expect(cy.get).toHaveBeenCalledWith('[aria-label="name filter"]');
      expect(command.type).toHaveBeenCalledWith('default-tenant');
      expect(command.type).toHaveBeenCalledTimes(1);
      expect(cy.testA11y).toHaveBeenLastCalledWith('Applications');
      expect(cy.exec).not.toHaveBeenCalled();
    },
  );

  it.each<[Record<string, string | boolean>, string]>([
    [{ LOCAL_CLUSTER: true }, '#login'],
    [{ LOGIN_PROVIDER: 'openshift', LOCAL_CLUSTER: true }, '#inputUsername, [id="page-sidebar"]'],
    [{ PERIODIC_RUN_STAGE: true }, '#username'],
  ])('preserves the deployed login flow with %j', (values, selector) => {
    runLoginHook(values);

    expect(cy.env).toHaveBeenCalledWith(['USERNAME', 'PASSWORD']);
    expect(cy.get.mock.calls).toContainEqual(expect.arrayContaining([selector]));
    expect(cy.testA11y).toHaveBeenLastCalledWith('Applications');
    expect(cy.exec).not.toHaveBeenCalled();
  });

  it('keeps the manual login fallback and skips login in Studio mode', () => {
    runLoginHook();
    expect(cy.env).not.toHaveBeenCalled();
    expect(cy.visit).toHaveBeenCalledWith('https://localhost:8080');
    expect(cy.testA11y).toHaveBeenLastCalledWith('Applications');

    jest.clearAllMocks();
    runLoginHook({ STUDIO_MODE: true, LOGIN_PROVIDER: 'cli', LOCAL_CLUSTER: true });
    expect(cy.visit).not.toHaveBeenCalled();
    expect(cy.env).not.toHaveBeenCalled();
  });
});
