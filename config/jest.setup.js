import '@testing-library/jest-dom';

jest.mock('../src/k8s', () => ({ __esModule: true, ...jest.requireActual('../src/k8s') }));

jest.mock('react-router-dom', () => ({
  __esModule: true,
  ...jest.requireActual('react-router-dom'),
}));

jest.mock('../src/components/Workspace/useWorkspaceInfo', () => ({
  __esModule: true,
  ...jest.requireActual('../src/components/Workspace/useWorkspaceInfo'),
}));
