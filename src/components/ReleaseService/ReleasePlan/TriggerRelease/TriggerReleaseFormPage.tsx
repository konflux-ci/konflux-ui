import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { Formik, FormikHelpers } from 'formik';
import { useSearchParam } from '~/hooks/useSearchParam';
import { useReleasePlans } from '../../../../hooks/useReleasePlans';
import { useSnapshot } from '../../../../hooks/useSnapshots';
import { APPLICATION_RELEASE_DETAILS_PATH, RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { useTrackEvent, TrackEvents } from '../../../../utils/analytics';
import { TriggerReleaseFormValues, createRelease, triggerReleaseFormSchema } from './form-utils';
import { TriggerReleaseForm } from './TriggerReleaseForm';

export const TriggerReleaseFormPage: React.FC = () => {
  const [snapshotName] = useSearchParam('snapshot');
  const [releasePlanName] = useSearchParam('releasePlan');
  const navigate = useNavigate();
  const track = useTrackEvent();
  const namespace = useNamespace();
  const [releasePlans] = useReleasePlans(namespace);

  // Fetch snapshot details to get the application name
  const [snapshotDetails, snapshotLoaded] = useSnapshot(
    snapshotName ? namespace : undefined,
    snapshotName || '',
  );

  // Show loading spinner if we're waiting for snapshot data to load
  if (snapshotName && !snapshotLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

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
        release_plan_name: newRelease.metadata.name,
        // eslint-disable-next-line camelcase
        target_snapshot: newRelease.spec.snapshot,
        releasePlan: newRelease.spec.releasePlan,
        namespace,
      });
      const application = releasePlans.filter((rp) => rp.metadata.name === values.releasePlan)?.[0]
        ?.spec?.application;
      navigate(
        APPLICATION_RELEASE_DETAILS_PATH.createPath({
          workspaceName: namespace,
          applicationName: application,
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

  const validReleasePlan = releasePlans?.find((rp) => rp.metadata.name === releasePlanName);

  const initialValues: TriggerReleaseFormValues = {
    releasePlan: validReleasePlan ? releasePlanName : '',
    snapshot: snapshotName ?? '',
    synopsis: '',
    description: '',
    topic: '',
    references: [],
    labels: [{ key: '', value: '' }],
  };

  return (
    <Formik<TriggerReleaseFormValues>
      onSubmit={handleSubmit}
      onReset={handleReset}
      validationSchema={triggerReleaseFormSchema}
      initialValues={initialValues}
    >
      {(props) => <TriggerReleaseForm {...props} snapshotDetails={snapshotDetails} />}
    </Formik>
  );
};
