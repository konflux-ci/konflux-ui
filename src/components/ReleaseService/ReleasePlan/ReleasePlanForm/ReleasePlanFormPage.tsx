import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Formik, FormikHelpers } from 'formik';
import { RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { ReleasePlanKind, ReleasePlanLabel } from '../../../../types/coreBuildService';
import { useTrackEvent, TrackEvents } from '../../../../utils/analytics';
import { ResolverRefParams } from '../../../IntegrationTests/IntegrationTestForm/utils/create-utils';
import {
  ReleasePlanFormValues,
  createReleasePlan,
  editReleasePlan,
  ReleasePipelineLocation,
  releasePlanFormParams,
  releasePlanFormSchema,
} from './form-utils';
import { ReleasePlanForm } from './ReleasePlanForm';

type Props = {
  releasePlan?: ReleasePlanKind;
};

export const ReleasePlanFormPage: React.FC<Props> = ({ releasePlan }) => {
  const navigate = useNavigate();
  const track = useTrackEvent();
  const namespace = useNamespace();
  const edit = !!releasePlan;

  const handleSubmit = async (
    values: ReleasePlanFormValues,
    { setSubmitting, setStatus }: FormikHelpers<ReleasePlanFormValues>,
  ) => {
    if (edit) {
      track(TrackEvents.ButtonClicked, {
        link_name: 'edit-release-plan-submit',
        release_plan_name: releasePlan.metadata.name,
        // eslint-disable-next-line camelcase
        target_namespace: releasePlan.spec.target,
        app_name: releasePlan.spec.application,
        namespace,
      });
    } else {
      track(TrackEvents.ButtonClicked, {
        link_name: 'add-release-plan-submit',
        namespace,
      });
    }
    try {
      edit
        ? await editReleasePlan(releasePlan, values, namespace, true)
        : await createReleasePlan(values, namespace, true);
      const newReleasePlan = edit
        ? await editReleasePlan(releasePlan, values, namespace)
        : await createReleasePlan(values, namespace);
      track(edit ? 'Release plan edited' : 'Release plan created', {
        release_plan_name: newReleasePlan.metadata.name,
        // eslint-disable-next-line camelcase
        target_namesapce: newReleasePlan.spec.target,
        app_name: newReleasePlan.spec.application,
        namespace,
      });
      navigate(RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace }));
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error while submitting integration test:', e);
      setSubmitting(false);
      setStatus({ submitError: e.message });
    }
  };

  const handleReset = () => {
    if (edit) {
      track(TrackEvents.ButtonClicked, {
        link_name: 'edit-release-plan-leave',
        release_plan_name: releasePlan.metadata.name,
        // eslint-disable-next-line camelcase
        target_namespace: releasePlan.spec.target,
        app_name: releasePlan.spec.application,
        namespace,
      });
    } else {
      track(TrackEvents.ButtonClicked, {
        link_name: 'add-release-plan-leave',
        namespace,
      });
    }
    navigate(RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace }));
  };

  const initialValues: ReleasePlanFormValues = {
    name: releasePlan?.metadata?.name ?? '',
    application: releasePlan?.spec?.application ?? '',
    autoRelease: !!(releasePlan?.metadata?.labels?.[ReleasePlanLabel.AUTO_RELEASE] === 'true'),
    standingAttribution: !!(
      releasePlan?.metadata?.labels?.[ReleasePlanLabel.STANDING_ATTRIBUTION] === 'true'
    ),
    releasePipelineLocation: releasePlan?.spec?.target
      ? releasePlan.spec.target === namespace
        ? ReleasePipelineLocation.current
        : ReleasePipelineLocation.target
      : undefined,
    serviceAccount: releasePlan?.spec?.serviceAccount ?? '',
    target: releasePlan?.spec?.target ?? '',
    data: (releasePlan?.spec?.data as string) ?? '',
    params: releasePlanFormParams(releasePlan),
    labels: releasePlan?.metadata?.labels
      ? Object.entries(releasePlan?.metadata?.labels).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }],
    git: {
      url:
        releasePlan?.spec?.pipelineRef?.params?.find((p) => p.name === ResolverRefParams.URL)
          ?.value ?? '',
      revision:
        releasePlan?.spec?.pipelineRef?.params?.find((p) => p.name === ResolverRefParams.REVISION)
          ?.value ?? '',
      path:
        releasePlan?.spec?.pipelineRef?.params?.find((p) => p.name === ResolverRefParams.PATH)
          ?.value ?? '',
    },
  };

  return (
    <Formik
      onSubmit={handleSubmit}
      onReset={handleReset}
      initialValues={initialValues}
      validationSchema={releasePlanFormSchema}
    >
      {(props) => <ReleasePlanForm {...props} edit={edit} />}
    </Formik>
  );
};
