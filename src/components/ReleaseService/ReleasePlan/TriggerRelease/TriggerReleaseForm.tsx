import * as React from 'react';
import { Form, PageSection, PageSectionVariants } from '@patternfly/react-core';
import { FormikProps, useField } from 'formik';
import { TextAreaField } from 'formik-pf';
import isEmpty from 'lodash-es/isEmpty';
import { useReleasePlans } from '../../../../../src/hooks/useReleasePlans';
import PageLayout from '../../../../components/PageLayout/PageLayout';
import { RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { FormFooter } from '../../../../shared';
import KeyValueField from '../../../../shared/components/formik-fields/key-value-input-field/KeyValueInputField';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { useWorkspaceBreadcrumbs } from '../../../../utils/breadcrumb-utils';
import { IssueType } from './AddIssueSection/AddIssueModal';
import { AddIssueSection } from './AddIssueSection/AddIssueSection';
import { TriggerReleaseFormValues } from './form-utils';
import { ReleasePlanDropdown } from './ReleasePlanDropdown';
import { SnapshotDropdown } from './SnapshotDropdown';

type Props = FormikProps<TriggerReleaseFormValues>;

export const getApplicationNameForReleasePlan = (releasePlans, selectedReleasePlan, loaded) => {
  if (!loaded || !releasePlans.length) {
    return '';
  }

  const currentReleasePlan = releasePlans.find((r) => r.metadata?.name === selectedReleasePlan);
  return currentReleasePlan?.spec?.application || '';
};

export const TriggerReleaseForm: React.FC<Props> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  dirty,
  errors,
  status,
}) => {
  const breadcrumbs = useWorkspaceBreadcrumbs();
  const namespace = useNamespace();
  const [{ value: labels }] = useField<TriggerReleaseFormValues['labels']>('labels');
  const [releasePlans, loaded] = useReleasePlans(namespace);
  const [selectedReleasePlanField] = useField('releasePlan');

  const applicationName = getApplicationNameForReleasePlan(
    releasePlans,
    selectedReleasePlanField.value,
    loaded,
  );

  return (
    <PageLayout
      title="Trigger release plan"
      description="A release plan schedules when to send your code to production."
      breadcrumbs={[
        ...breadcrumbs,
        {
          path: RELEASE_SERVICE_PATH.createPath({ workspaceName: namespace }),
          name: 'Releases',
        },
        {
          path: '#',
          name: 'Trigger release plan',
        },
      ]}
      footer={
        <FormFooter
          submitLabel="Trigger"
          handleCancel={handleReset}
          handleSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableSubmit={!dirty || !isEmpty(errors) || isSubmitting}
          errorMessage={status?.submitError}
        />
      }
    >
      <PageSection variant={PageSectionVariants.light} isFilled isWidthLimited>
        <Form style={{ maxWidth: '70%' }}>
          <ReleasePlanDropdown
            name="releasePlan"
            helpText="The release you want to release to the environments in your target namespace."
            releasePlans={releasePlans}
            loaded={loaded}
            required
          />
          <SnapshotDropdown
            name="snapshot"
            helpText="The release you want to release to the environments in your target namespace."
            required
            applicationName={applicationName}
          />
          <AddIssueSection field="issues" issueType={IssueType.BUG} />

          <AddIssueSection field="cves" issueType={IssueType.CVE} />

          <TextAreaField
            name="synopsis"
            label="Synopsis"
            helperText="What is the content and purpose of this release?"
          />
          <TextAreaField
            name="topic"
            label="Topic"
            helperText="What topics are related to this release? Such as osp-director-downloader-container or osp-director-agent-container"
          />

          <TextAreaField name="description" label="Description" />
          <TextAreaField name="solution" label="Solution" />
          <TextAreaField
            name="references"
            label="References"
            helperText="Please enter at least 1 reference"
          />
          <KeyValueField
            name="labels"
            label="Labels"
            description="You can add labels to provide more context or tag your release plan."
            entries={labels}
          />
        </Form>
      </PageSection>
    </PageLayout>
  );
};
