import { MemoryRouter } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useReleasePlan } from '~/hooks/useReleasePlans';
import { useRelease } from '~/hooks/useReleases';
import { createUseParamsMock } from '~/utils/test-utils';
import ReleasePipelineRunTab from '../ReleasePipelineRunTab';

jest.mock('~/hooks/useReleasePlans', () => ({
  useReleasePlan: jest.fn(),
}));

jest.mock('~/hooks/useReleases', () => ({
  useRelease: jest.fn(),
}));

jest.mock('~/hooks/useReleaseStatus', () => ({
  useReleaseStatus: jest.fn(() => ({})),
}));

jest.mock('~/utils/release-utils', () => {
  const actual = jest.requireActual('~/utils/release-utils');
  return {
    ...actual,
    getNamespaceAndPRName: jest.fn((pr) => pr.split('/')),
    getTenantCollectorProcessingFromRelease: jest.fn(),
    getTenantProcessingFromRelease: jest.fn(),
    getFinalFromRelease: jest.fn(),
    getManagedProcessingFromRelease: jest.fn(),
  };
});

const useMockRelease = useRelease as jest.Mock;
const useMockReleasePlan = useReleasePlan as jest.Mock;

const wrapper = (
  <MemoryRouter>
    <FilterContextProvider filterParams={['name']}>
      <ReleasePipelineRunTab />
    </FilterContextProvider>
  </MemoryRouter>
);

describe('ReleasePipelineRunTab', () => {
  createUseParamsMock({ releaseName: 'my-release' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders spinner while data is loading', () => {
    useMockRelease.mockReturnValue([null, false, undefined, undefined, false]);
    useMockReleasePlan.mockReturnValue([null, false]);
    render(wrapper);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('renders empty state when no pipeline runs exist', () => {
    useMockRelease.mockReturnValue([
      {
        spec: {
          snapshot: 'snap1',
          releasePlan: 'plan1',
        },
      },
      true,
      undefined,
      undefined,
      false,
    ]);
    useMockReleasePlan.mockReturnValue([{}, true]);
    render(wrapper);
    expect(
      screen.getByText(
        'A release object represents a deployed snapshot of your application components. To view your releases, set up a release plan for your application.',
      ),
    ).toBeInTheDocument();
  });
});
