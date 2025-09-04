import { UseQueryOptions } from '@tanstack/react-query';
import { describe, it, expect, expectTypeOf } from "vitest";
// Note: Tests use Vitest. If your project uses a different runner, adjust imports accordingly.

type TQueryOptions<TResource> = Omit<UseQueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
  filterData?: (resource: TResource) => TResource;
};

// BEGIN: TQueryOptions type tests (Vitest)
/**
 * Test framework detected/assumed: Vitest
 * These tests validate the type-level contract introduced in the PR diff:
 *   export type TQueryOptions<TResource> = Omit<UseQueryOptions<TResource>, 'queryKey' | 'queryFn'> & {
 *     filterData?: (resource: TResource) => TResource;
 *   };
 *
 * Focus:
 * - filterData exists, is optional, and maps TResource -> TResource
 * - queryKey and queryFn are intentionally omitted from UseQueryOptions
 * - Generic behavior remains consistent across various TResource shapes
 * - Representative happy-path examples compile and execute
 */

describe('TQueryOptions type', () => {
  it('exposes an optional filterData with signature (TResource) => TResource', () => {
    type User = { id: number; name: string };

    type Fn = NonNullable<TQueryOptions<User>['filterData']>;

    // Callable with the resource type
    expectTypeOf<Fn>().toBeCallableWith({ id: 1, name: 'Ada' } as User);

    // Returns the same resource type
    expectTypeOf<ReturnType<Fn>>().toEqualTypeOf<User>();

    // Happy path object with common UseQueryOptions fields and filterData
    const options: TQueryOptions<User> = {
      enabled: true,
      staleTime: 1000,
      filterData: (u) => ({ ...u, name: u.name.trim() }),
    };
    expect(typeof options).toBe('object');
  });

  it('omits queryKey and queryFn from UseQueryOptions', () => {
    type User = { id: number; name: string };

    type HasQueryKey = 'queryKey' extends keyof TQueryOptions<User> ? true : false;
    type HasQueryFn = 'queryFn' extends keyof TQueryOptions<User> ? true : false;

    expectTypeOf<HasQueryKey>().toEqualTypeOf<false>();
    expectTypeOf<HasQueryFn>().toEqualTypeOf<false>();

    // Compile-time negative checks (tsc): these lines must produce errors; ts-expect-error enforces that.
    // If the property is ever (incorrectly) reintroduced, the test file will fail to type-check.
    // @ts-expect-error - 'queryKey' must not be allowed
    const withQueryKey: TQueryOptions<User> = {
      enabled: true,
      // @ts-expect-error queryKey should not exist
      queryKey: ['users'],
    };
    // @ts-expect-error - 'queryFn' must not be allowed
    const withQueryFn: TQueryOptions<User> = {
      enabled: true,
      // @ts-expect-error queryFn should not exist
      queryFn: async () => ({ id: 1, name: 'Ada' } as User),
    };

    // Keep a trivial runtime assertion so the test always executes.
    expect([withQueryKey, withQueryFn]).toBeDefined();
  });

  it('preserves generics for different resource shapes (object, union)', () => {
    type Post = { id: string; body: string };
    type FnPost = NonNullable<TQueryOptions<Post>['filterData']>;
    expectTypeOf<FnPost>().toBeCallableWith({ id: '1', body: 'x' } as Post);
    expectTypeOf<ReturnType<FnPost>>().toEqualTypeOf<Post>();

    type Union = { kind: 'a'; v: number } | { kind: 'b'; v: string };
    type FnUnion = NonNullable<TQueryOptions<Union>['filterData']>;
    expectTypeOf<FnUnion>().toBeCallableWith({ kind: 'a', v: 1 } as Union);
    expectTypeOf<ReturnType<FnUnion>>().toEqualTypeOf<Union>();
  });

  it('accepts common UseQueryOptions fields when present (enabled, staleTime) even without filterData', () => {
    type User = { id: number; name: string };
    const opts: TQueryOptions<User> = {
      enabled: false,
      staleTime: 5000,
    };
    expect(opts.enabled).toBe(false);
    expect(opts.staleTime).toBe(5000);
  });

  it('marks filterData as optional', () => {
    type User = { id: number; name: string };

    type IsOptional<K extends PropertyKey, T> =
      K extends keyof T ? (Record<string, never> extends Pick<T, K> ? true : false) : false;

    type Result = IsOptional<'filterData', TQueryOptions<User>>;
    expectTypeOf<Result>().toEqualTypeOf<true>();
  });
});
// END: TQueryOptions type tests