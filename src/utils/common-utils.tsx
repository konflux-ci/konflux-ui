import { curry } from 'lodash-es';
import { HttpError } from '~/k8s/error';
import { ApplicationKind } from '~/types';
import { PipelineRunModel } from '../models';
import { K8sModelCommon, K8sResourceCommon, OwnerReference } from '../types/k8s';

export const getApplicationDisplayName = (application: ApplicationKind): string =>
  application?.spec?.displayName ?? application?.metadata?.name;

export const getResourceFromOwnerReference = curry(
  (model: K8sModelCommon, resource: K8sResourceCommon): OwnerReference => {
    return resource
      ? resource.metadata.ownerReferences?.find((res) => res.kind === model.kind)
      : undefined;
  },
);

export const getPipelineRunFromTaskRunOwnerRef = getResourceFromOwnerReference(PipelineRunModel);

export const has404Error = (error: unknown): error is HttpError => {
  return error instanceof HttpError && error.code === 404;
};

/**
 * Parse a string value to boolean
 * @param value - String value ("true"/"false" or undefined)
 * @param defaultValue - Default value if undefined
 */
export function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  return value.toLowerCase() === 'true';
}

/**
 * Parse a string value to number
 * @param value - String value or undefined
 * @param defaultValue - Default value if undefined or invalid
 */
export function parseNumber(value: string | undefined, defaultValue: number): number {
  if (value === undefined || value === '') {
    return defaultValue;
  }
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}
