import * as React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { Formik, FormikHelpers } from 'formik';
import { useReleasePlans } from '../../../../hooks/useReleasePlans';
import { useSnapshot } from '../../../../hooks/useSnapshots';
import { APPLICATION_RELEASE_DETAILS_PATH, RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { RouterParams } from '../../../../routes/utils';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { useTrackEvent, TrackEvents } from '../../../../utils/analytics';
import { TriggerReleaseFormValues, createRelease, triggerReleaseFormSchema } from './form-utils';
import { TriggerReleaseForm } from './TriggerReleaseForm';

export const TriggerReleaseFormPage: React.FC = () => {
  const { releasePlanName } = useParams<RouterParams>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const track = useTrackEvent();
  const namespace = useNamespace();
  const [releasePlans] = useReleasePlans(namespace);

  // Get snapshot from search params if provided
  const snapshotName = searchParams.get('snapshot');

  // Fetch snapshot details to get the application name
  const [snapshotDetails, snapshotLoaded] = useSnapshot(namespace, snapshotName || '');

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

  const validReleasePlan = releasePlans.find((rp) => rp.metadata.name === releasePlanName);

  // Create initial values that will update when snapshot data loads
  const initialValues: TriggerReleaseFormValues = React.useMemo(
    () => ({
      releasePlan: validReleasePlan ? releasePlanName : '',
      snapshot: snapshotName || '',
      synopsis: '',
      description: '',
      topic: '',
      references: [],
      labels: [{ key: '', value: '' }],
    }),
    [validReleasePlan, releasePlanName, snapshotName],
  );

  // Show loading spinner if we're waiting for snapshot data to load
  if (snapshotName && !snapshotLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <Formik
      onSubmit={handleSubmit}
      onReset={handleReset}
      validationSchema={triggerReleaseFormSchema}
      initialValues={initialValues}
      enableReinitialize={true}
    >
      {(props) => <TriggerReleaseForm {...props} snapshotDetails={snapshotDetails} />}
    </Formik>
  );
};
