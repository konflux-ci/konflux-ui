import { defaultsDeep } from 'lodash-es';

/**
 * Create new object by recursively assigning property defaults to `obj`.
 */
export const applyDefaults = <TObject>(obj: TObject, defaults: unknown): TObject =>
  defaultsDeep({}, obj, defaults);

/**
 * Create new object by recursively assigning property overrides to `obj`.
 */
export const applyOverrides = <TObject>(obj: TObject, overrides: unknown): TObject =>
  defaultsDeep({}, overrides, obj);
