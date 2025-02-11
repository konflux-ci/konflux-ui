import React from 'react';
import { LoaderFunction, LoaderFunctionArgs } from 'react-router-dom';
import { memoize } from 'lodash-es';
import { getNamespaceUsingWorspaceFromQueryCache } from '../components/Workspace/utils';
import { k8sCreateResource } from '../k8s/k8s-fetch';
import { SelfSubjectAccessReviewModel } from '../models/rbac';
import { useNamespace } from '../shared/providers/Namespace';
import { K8sModelCommon, K8sVerb } from '../types/k8s';
import {
  AccessReviewResource,
  AccessReviewResourceAttributes,
  AccessReviewResourceAttributesArray,
  AccessReviewResources,
  SelfSubjectAccessReviewKind,
} from '../types/rbac';

export const checkAccess = memoize(
  async (group, resource, subresource, namespace, verb) => {
    return k8sCreateResource<SelfSubjectAccessReviewKind>({
      model: SelfSubjectAccessReviewModel,
      resource: {
        apiVersion: 'authorization.k8s.io/v1',
        kind: 'SelfSubjectAccessReview',
        spec: {
          resourceAttributes: {
            group,
            resource,
            subresource,
            namespace,
            verb,
          },
        },
      },
    });
  },
  (...args) => args.join('~'),
);

export function checkReviewAccesses(
  resourceAttributesArray: AccessReviewResource | AccessReviewResource[],
  namespace: string,
): Promise<boolean> {
  if (!Array.isArray(resourceAttributesArray)) {
    const model = resourceAttributesArray.model;
    return checkAccess(
      model.apiGroup,
      model.plural,
      undefined,
      namespace,
      resourceAttributesArray.verb,
    ).then((res) => res.status.allowed);
  }
  return Promise.all(
    resourceAttributesArray
      .map(({ model, verb }) => ({
        group: model.apiGroup,
        resource: model.plural,
        namespace,
        verb,
      }))
      .map((resourceAttributes: AccessReviewResourceAttributes) =>
        checkAccess(
          resourceAttributes.group,
          resourceAttributes.resource,
          resourceAttributes?.subresource,
          resourceAttributes.namespace,
          resourceAttributes.verb,
        ),
      ),
  )
    .then((results) => results.map((res) => res.status.allowed).every(Boolean))
    .catch((e) => {
      // eslint-disable-next-line no-console
      console.warn(`SelfSubjectAccessReview failed: ${e}`);
      return true;
    });
}

export const useAccessReview = (
  resourceAttributes: AccessReviewResourceAttributes,
): [boolean, boolean] => {
  const [loaded, setLoaded] = React.useState(false);
  const [isAllowed, setIsAllowed] = React.useState(false);

  React.useEffect(() => {
    // wait for workspace context to load the namespace
    if (resourceAttributes.namespace) {
      checkAccess(
        resourceAttributes.group,
        resourceAttributes.resource,
        resourceAttributes.subresource,
        resourceAttributes.namespace,
        resourceAttributes.verb,
      )
        .then((result) => {
          setIsAllowed(result.status.allowed);
          setLoaded(true);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(`SelfSubjectAccessReview failed: ${e}`);
          setIsAllowed(true);
          setLoaded(true);
        });
    }
  }, [resourceAttributes]);

  return [isAllowed, loaded];
};

export const useAccessReviewForModel = (
  model: K8sModelCommon,
  verb: K8sVerb,
): [boolean, boolean] => {
  const namespace = useNamespace();
  return useAccessReview({ group: model.apiGroup, resource: model.plural, namespace, verb });
};

export const useAccessReviews = (
  resourceAttributesArray: AccessReviewResourceAttributesArray,
): [boolean, boolean] => {
  const [loaded, setLoaded] = React.useState(false);
  const [isAllowed, setIsAllowed] = React.useState(false);

  React.useEffect(() => {
    // wait for workspace context to load the namespace
    if (resourceAttributesArray[0].namespace) {
      const allChecks = [];
      const resourceAccess = [];
      resourceAttributesArray.map((resourceAttributes) => {
        allChecks.push(
          checkAccess(
            resourceAttributes.group,
            resourceAttributes.resource,
            resourceAttributes.subresource,
            resourceAttributes.namespace,
            resourceAttributes.verb,
          ),
        );
      });
      Promise.all(allChecks)
        .then((results) => {
          results.map((result) => {
            resourceAccess.push({
              resource: result.spec.resourceAttributes.resource,
              verb: result.spec.resourceAttributes.verb,
              allowed: result.status.allowed,
            });
          });
          if (resourceAccess.every((access) => access.allowed)) {
            setIsAllowed(true);
          }
          setLoaded(true);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(`SelfSubjectAccessReview failed: ${e}`);
          setIsAllowed(true);
          setLoaded(true);
        });
    }
  }, [resourceAttributesArray]);

  return [isAllowed, loaded];
};

export const useAccessReviewForModels = (
  accessReviewResources: AccessReviewResources,
): [boolean, boolean] => {
  const namespace = useNamespace();

  const resourceAttributes: AccessReviewResourceAttributesArray = accessReviewResources.map(
    ({ model, verb }) => ({
      group: model.apiGroup,
      resource: model.plural,
      namespace,
      verb,
    }),
  );
  return useAccessReviews(resourceAttributes);
};

export const createLoaderWithAccessCheck =
  (loader: LoaderFunction, res: AccessReviewResource | AccessReviewResource[]): LoaderFunction =>
  async (args: LoaderFunctionArgs) => {
    const ns = await getNamespaceUsingWorspaceFromQueryCache(args.params.workspaceName);
    let allowed: boolean;
    if (ns) {
      allowed = await checkReviewAccesses(res, ns);
      if (!allowed) {
        throw new Response('Access check Denied', { status: 403 });
      }
    }
    return { accessCheck: allowed, data: await loader(args) };
  };
