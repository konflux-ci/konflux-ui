/**
 * The type `{}` doesn't mean "any empty object", it means "any non-nullish value".
 *
 * Use the `AnyObject` type for objects whose structure is unknown.
 *
 * @see https://github.com/typescript-eslint/typescript-eslint/issues/2063#issuecomment-675156492
 */
export type AnyObject = Record<string, unknown>;
