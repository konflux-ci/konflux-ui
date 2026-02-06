import { useAllComponents, useComponents, useSortedComponents } from '../../../hooks/useComponents';
import { useIntegrationTestScenarios } from '../../../hooks/useIntegrationTestScenarios';
import { useLatestIntegrationTestPipelines } from '../../../hooks/useLatestIntegrationTestPipelines';
import { useLatestPushBuildPipelines } from '../../../hooks/useLatestPushBuildPipelines';
import { useReleasePlans } from '../../../hooks/useReleasePlans';
import { useReleases } from '../../../hooks/useReleases';
import {
  mockBuildPipelinesData,
  mockComponentsData,
  mockIntegrationTestScenariosData,
  mockReleasePlansData,
  mockReleasesData,
  mockTestPipelinesData,
} from './index';

jest.mock('../../../hooks/useComponents', () => ({
  useComponents: jest.fn(),
  useAllComponents: jest.fn(),
  useSortedComponents: jest.fn(),
}));
jest.mock('../../../hooks/useIntegrationTestScenarios', () => ({
  useIntegrationTestScenarios: jest.fn(),
}));
jest.mock('../../../hooks/useLatestPushBuildPipelines', () => ({
  useLatestPushBuildPipelines: jest.fn(),
}));
jest.mock('../../../hooks/useReleases', () => ({
  useReleases: jest.fn(),
}));
jest.mock('../../../hooks/useReleasePlans', () => ({
  useReleasePlans: jest.fn(),
}));
jest.mock('../../../hooks/useLatestIntegrationTestPipelines', () => ({
  useLatestIntegrationTestPipelines: jest.fn(),
}));

export const getMockWorkflows = () => {
  const workflowMocks = {
    useComponentsMock: useComponents as jest.Mock,
    useAllComponentsMock: useAllComponents as jest.Mock,
    useSortedComponentsMock: useSortedComponents as jest.Mock,
    useIntegrationTestScenariosMock: useIntegrationTestScenarios as jest.Mock,
    useLatestPushBuildPipelinesMock: useLatestPushBuildPipelines as jest.Mock,
    useReleasesMock: useReleases as jest.Mock,
    useReleasePlansMock: useReleasePlans as jest.Mock,
    useLatestIntegrationTestPipelinesMock: useLatestIntegrationTestPipelines as jest.Mock,
  };

  const applyWorkflowMocks = (mockFns) => {
    mockFns.useComponentsMock.mockReturnValue([mockComponentsData, true]);
    mockFns.useAllComponentsMock.mockReturnValue([mockComponentsData, true]);
    mockFns.useSortedComponentsMock.mockReturnValue([[], false]);
    mockFns.useIntegrationTestScenariosMock.mockReturnValue([
      mockIntegrationTestScenariosData,
      true,
    ]);
    mockFns.useLatestPushBuildPipelinesMock.mockReturnValue([mockBuildPipelinesData, true]);
    mockFns.useReleasePlansMock.mockReturnValue([mockReleasePlansData, true]);
    mockFns.useReleasesMock.mockReturnValue([mockReleasesData, true]);
    mockFns.useLatestIntegrationTestPipelinesMock.mockReturnValue([mockTestPipelinesData, true]);
  };
  return { workflowMocks, applyWorkflowMocks };
};
