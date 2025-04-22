import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, waitFor, screen } from '@testing-library/react';
import { mockSecret, mockServiceAccounts } from '~/components/Secrets/__data__/mock-secrets';
import * as utils from '~/components/Secrets/utils/service-account-utils';
import { SecretKind } from '~/types';
import { useLinkedServiceAccounts } from '../useLinkedServiceAccounts';

jest.mock('~/components/Secrets/utils/service-account-utils', () => {
  const originalModule = jest.requireActual('~/components/Secrets/utils/service-account-utils');
  return {
    ...originalModule,
    getLinkedServiceAccounts: jest.fn(),
  };
});

const TestComponent = ({ secret }: { secret: SecretKind }) => {
  const { data, isLoading } = useLinkedServiceAccounts(secret);

  if (isLoading) return <div>Loading...</div>;
  return <div>{data?.map((sa) => <div key={sa.metadata.name}>{sa.metadata.name}</div>)}</div>;
};

describe('useLinkedServiceAccounts', () => {
  let queryClient: QueryClient;
  let spyGetLinkedServiceAccounts: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();

    // Initialize QueryClient once for the tests
    queryClient = new QueryClient();

    // Spy on the getLinkedServiceAccounts function
    spyGetLinkedServiceAccounts = jest.spyOn(utils, 'getLinkedServiceAccounts');
  });

  it('should fetch linked service accounts and render them', async () => {
    // Mock the resolved value for the linked service accounts
    spyGetLinkedServiceAccounts.mockResolvedValue(mockServiceAccounts as SecretKind[]);

    const validSecret: SecretKind = {
      ...mockSecret,
      type: 'kubernetes.io/basic-auth',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent secret={validSecret} />
      </QueryClientProvider>,
    );

    // Wait for the component to finish rendering and verify if service accounts are displayed
    await waitFor(() => {
      expect(screen.getByText(mockServiceAccounts[0].metadata.name)).toBeInTheDocument();
      expect(screen.getByText(mockServiceAccounts[1].metadata.name)).toBeInTheDocument();
    });
  });

  it('should not call queryFn if secret is incomplete', async () => {
    // Mocking a secret with missing name
    const incompleteSecret = {
      metadata: { name: '' },
    } as SecretKind;

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent secret={incompleteSecret} />
      </QueryClientProvider>,
    );

    // Make sure getLinkedServiceAccounts is not called when secret is incomplete
    await waitFor(() => {
      expect(spyGetLinkedServiceAccounts).not.toHaveBeenCalled();
    });
  });

  it('should call queryFn if secret.type is "kubernetes.io/basic-auth"', async () => {
    const secretWithTypeA: SecretKind = {
      ...mockSecret,
      type: 'kubernetes.io/basic-auth',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent secret={secretWithTypeA} />
      </QueryClientProvider>,
    );

    // Ensure queryFn is called when secret.type is "kubernetes.io/basic-auth"
    await waitFor(() => {
      expect(spyGetLinkedServiceAccounts).toHaveBeenCalled();
    });
  });

  it('should call queryFn if secret.type is "kubernetes.io/dockerconfigjson"', async () => {
    const secretWithTypeB: SecretKind = {
      ...mockSecret,
      type: 'kubernetes.io/dockerconfigjson',
    };

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent secret={secretWithTypeB} />
      </QueryClientProvider>,
    );

    // Ensure queryFn is called when secret.type is "kubernetes.io/dockerconfigjson"
    await waitFor(() => {
      expect(spyGetLinkedServiceAccounts).toHaveBeenCalled();
    });
  });

  it('should not call queryFn if secret.type is not "kubernetes.io/basic-auth" or "kubernetes.io/dockerconfigjson"', async () => {
    // Mock the secret with a type that should not trigger the query
    const secretWithOtherType: SecretKind = {
      ...mockSecret,
      type: 'Opaque', // Not a supported type for querying linked service accounts
    };

    render(
      <QueryClientProvider client={queryClient}>
        <TestComponent secret={secretWithOtherType} />
      </QueryClientProvider>,
    );

    // Ensure that getLinkedServiceAccounts is NOT called for unsupported secret types
    await waitFor(() => {
      expect(spyGetLinkedServiceAccounts).not.toHaveBeenCalled();
    });
  });
});
