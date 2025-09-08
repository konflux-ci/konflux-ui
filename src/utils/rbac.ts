import React from 'react';
import { defer, LoaderFunction, LoaderFunctionArgs } from 'react-router-dom';
import { memoize } from 'lodash-es';
import { getUserDataWithFallback } from '~/auth/utils';
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
    const user = await getUserDataWithFallback();

    return k8sCreateResource<SelfSubjectAccessReviewKind>({
      model: SelfSubjectAccessReviewModel,
      resource: {
        apiVersion: 'authorization.k8s.io/v1',
        kind: 'SelfSubjectAccessReview',
        spec: {
          user: user.preferredUsername,
          group: ['system:authenticated'],
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
      return false; // secure default deny
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
          setIsAllowed(false); // secure default deny
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
          setIsAllowed(resourceAccess.every((access) => access.allowed));
          setLoaded(true);
        })
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn(`SelfSubjectAccessReview failed: ${e}`);
          setIsAllowed(false); // secure default deny
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
    const ns = args.params.workspaceName;
    let allowed: boolean;
    if (ns) {
      allowed = await checkReviewAccesses(res, ns);
      if (!allowed) {
        throw new Response('Access check Denied', { status: 403 });
      }
    }
    return defer({ accessCheck: allowed, data: loader(args) });
  };
