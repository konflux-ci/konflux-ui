import { differenceBy, union } from 'lodash-es';
import * as yup from 'yup';
import { K8sQueryPatchResource } from '../../k8s';
import { ComponentModel } from '../../models';
import { NudgeStats } from '../../types';
import {
  ComponentRelationFormikValue,
  ComponentRelationNudgeType,
  ComponentRelationValue,
} from './type';

export const DUPLICATE_RELATONSHIP = 'duplicate-component-relationship';

export const toCustomBoolean = (value: unknown) => {
  // Treat empty array as false
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return !!value;
};

export const componentRelationValidationSchema = yup.mixed().test(
  (values: ComponentRelationFormikValue) =>
    yup
      .object()
      .shape({
        relations: yup
          .array()
          .of(
            yup
              .object()
              .shape({
                source: yup.string(),

                nudgeType: yup.string().required(),
                target: yup.array().of(yup.string()),
              })
              .test('duplicate-relation-test', DUPLICATE_RELATONSHIP, (value) => {
                const filteredValue = values.relations.filter(
                  (val) => val.source === value.source && val.nudgeType === value.nudgeType,
                );
                return filteredValue.length < 2;
              })
              .test('incomplete-relation-test', (value) => {
                return toCustomBoolean(value.source) === toCustomBoolean(value.target);
              }),
          )
          .required()
          .min(1),
      })
      .validate(values, { abortEarly: false }) as unknown as boolean,
);

export const transformNudgeData = (data: ComponentRelationValue[]): { [key: string]: string[] } => {
  return data.reduce((acc: Record<string, string[]>, { source, nudgeType, target }) => {
    if (!source) return acc;
    if (nudgeType === ComponentRelationNudgeType.NUDGES) {
      acc[source] = acc[source] ? union(acc[source], target) : target;
      return acc;
    }
    target.length > 0 &&
      target.forEach((t) => {
        acc[t] = acc[t] ? union(acc[t], [source]) : [source];
      });
    return acc;
  }, {});
};

export const computeNudgeDataChanges = (
  initialValues: ComponentRelationValue[],
  values: ComponentRelationValue[],
): ComponentRelationValue[] => {
  // Find the missing relation and set the target to [] to remove it
  const removedSources = differenceBy(initialValues, values, 'source').map((val) => ({
    ...val,
    target: [],
  }));
  return [...values, ...removedSources];
};

export const updateNudgeDependencies = async (
  values: ComponentRelationValue[],
  initialValues: ComponentRelationValue[],
  namespace: string,
  dryRun?: boolean,
) => {
  const valueChanges = computeNudgeDataChanges(initialValues, values);
  const transformedData = transformNudgeData(valueChanges);
  const data = [];
  for (const [componentName, nudgeData] of Object.entries(transformedData)) {
    const result = await K8sQueryPatchResource({
      model: ComponentModel,
      queryOptions: {
        name: componentName,
        ns: namespace,
        ...(dryRun && { queryParams: { dryRun: 'All' } }),
      },
      patches: [
        {
          op: 'replace',
          path: `/spec/${NudgeStats.NUDGES}`,
          value: nudgeData,
        },
      ],
    });
    data.push(result);
  }
  return data;
};
