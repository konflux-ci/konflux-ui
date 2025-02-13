import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
// This adds fetch to node environment
import 'whatwg-fetch';

// Mock Request if not available
if (typeof Request !== 'function') {
  global.Request = class Request {
    constructor(input, init) {
      return new URL(input.toString());
    }
  };
}

jest.mock('../src/k8s', () => ({ __esModule: true, ...jest.requireActual('../src/k8s') }));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
}));

jest.mock('../src/components/Workspace/useWorkspaceInfo', () => ({
  __esModule: true,
  ...jest.requireActual('../src/components/Workspace/useWorkspaceInfo'),
}));

jest.mock('../src/shared/providers/Namespace/useNamespaceInfo', () => ({
  __esModule: true,
  ...jest.requireActual('../src/shared/providers/Namespace/useNamespaceInfo'),
}));

jest.mock('../src/utils/rbac', () => ({
  __esModule: true,
  ...jest.requireActual('../src/utils/rbac'),
}));

jest.mock('../src/hooks/useApplications', () => ({
  __esModule: true,
  ...jest.requireActual('../src/hooks/useApplications'),
}));

afterAll(() => {
  jest.clearAllMocks();
});

configure({ testIdAttribute: 'data-test' });
