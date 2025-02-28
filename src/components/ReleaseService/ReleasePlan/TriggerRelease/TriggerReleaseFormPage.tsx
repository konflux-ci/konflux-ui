import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Formik, FormikHelpers } from 'formik';
import { useReleasePlans } from '../../../../hooks/useReleasePlans';
import { APPLICATION_RELEASE_DETAILS_PATH, RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { RouterParams } from '../../../../routes/utils';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { useTrackEvent, TrackEvents } from '../../../../utils/analytics';
import { TriggerReleaseFormValues, createRelease, triggerReleaseFormSchema } from './form-utils';
import { TriggerReleaseForm } from './TriggerReleaseForm';

export const TriggerReleaseFormPage: React.FC = () => {
  const { releasePlanName } = useParams<RouterParams>();
  const navigate = useNavigate();
  const track = useTrackEvent();
  const namespace = useNamespace();
  const [releasePlans] = useReleasePlans(namespace);

  const handleSubmit = async (
    values: TriggerReleaseFormValues,
    { setSubmitting, setStatus }: FormikHelpers<TriggerReleaseFormValues>,
  ) => {
    track(TrackEvents.ButtonClicked, {
      link_name: 'trigger-release-plan-submit',
      namespace,
    });

    try {
      const newRelease = await createRelease(values, namespace);
      track('Release plan triggered', {
        // eslint-disable-next-line camelcase
        release_plan_name: newRelease.metadata.name,
        // eslint-disable-next-line camelcase
        target_snapshot: newRelease.spec.snapshot,
        releasePlan: newRelease.spec.releasePlan,
        namespace,
      });
      const applicationName = releasePlans.filter(
        (rp) => rp.metadata.name === values.releasePlan,
      )?.[0]?.spec?.application;
      navigate(
        APPLICATION_RELEASE_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName,
          releaseName: newRelease.metadata?.name,
        }),
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Error while submitting integration test:', e);
      setSubmitting(false);
      setStatus({ submitError: e.message });
    }
  };

  const handleReset = () => {
    track(TrackEvents.ButtonClicked, {
      link_name: 'trigger-release-plan-leave',
      namespace,
    });

    navigate(RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace }));
  };

  const initialValues: TriggerReleaseFormValues = {
    releasePlan: releasePlanName,
    snapshot: '',
    synopsis: '',
    description: '',
    topic: '',
    references: '',
    labels: [{ key: '', value: '' }],
  };

  return (
    <Formik
      onSubmit={handleSubmit}
      onReset={handleReset}
      validationSchema={triggerReleaseFormSchema}
      initialValues={initialValues}
    >
      {(props) => <TriggerReleaseForm {...props} />}
    </Formik>
  );
};
