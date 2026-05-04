/**
 * Mock for src/utils/rbac.ts — every RBAC check returns "allowed + loaded"
 * so that screenshot scenarios render without permission gates.
 *
 * Every export from the real module is stubbed here so that the Vite
 * resolveId redirect is a drop-in replacement.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyArgs = any[];

export const checkAccess = (..._args: AnyArgs) => Promise.resolve({ status: { allowed: true } });

export const checkReviewAccesses = (..._args: AnyArgs) => Promise.resolve(true);

export const useAccessReview = (..._args: AnyArgs): [boolean, boolean] => [true, true];

export const useAccessReviewForModel = (..._args: AnyArgs): [boolean, boolean] => [true, true];

export const useAccessReviews = (..._args: AnyArgs): [boolean, boolean] => [true, true];

export const useAccessReviewForModels = (..._args: AnyArgs): [boolean, boolean] => [true, true];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createLoaderWithAccessCheck = (loader: any) => loader;
