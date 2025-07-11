import * as React from 'react';
import {
  Button,
  Form,
  Grid,
  GridItem,
  PageSection,
  PageSectionVariants,
  TextInput,
  TextInputTypes,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FormikProps, useField } from 'formik';
import { InputField, TextAreaField } from 'formik-pf';
import isEmpty from 'lodash-es/isEmpty';
import { FilterContextProvider } from '~/components/Filter/generic/FilterContext';
import { useReleasePlans } from '../../../../../src/hooks/useReleasePlans';
import PageLayout from '../../../../components/PageLayout/PageLayout';
import { RELEASE_SERVICE_PATH } from '../../../../routes/paths';
import { FormFooter } from '../../../../shared';
import KeyValueField from '../../../../shared/components/formik-fields/key-value-input-field/KeyValueInputField';
import TextColumnField from '../../../../shared/components/formik-fields/text-column-field/TextColumnField';
import { useNamespace } from '../../../../shared/providers/Namespace';
import { Snapshot } from '../../../../types/coreBuildService';
import { IssueType } from './AddIssueSection/AddIssueModal';
import { AddIssueSection } from './AddIssueSection/AddIssueSection';
import { TriggerReleaseFormValues } from './form-utils';
import { ReleasePlanDropdown } from './ReleasePlanDropdown';
import { SnapshotDropdown } from './SnapshotDropdown';

type Props = FormikProps<TriggerReleaseFormValues> & {
  snapshotDetails?: Snapshot;
};

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
  snapshotDetails,
}) => {
  const namespace = useNamespace();
  const [{ value: labels }] = useField<TriggerReleaseFormValues['labels']>('labels');
  const [releasePlans, loaded] = useReleasePlans(namespace);
  const [selectedReleasePlanField] = useField('releasePlan');
  const [reference, setReference] = React.useState<string>('');
  const [references, , { setValue }] =
    useField<TriggerReleaseFormValues['references']>('references');

  const releasePlanApplicationName = getApplicationNameForReleasePlan(
    releasePlans,
    selectedReleasePlanField.value,
    loaded,
  );

  // Use application name from release plan if available, otherwise use from snapshot details
  const applicationName = releasePlanApplicationName || snapshotDetails?.spec?.application || '';

  return (
    <PageLayout
      title="Trigger release plan"
      description="A release plan schedules when to send your code to production."
      breadcrumbs={[
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
          <FilterContextProvider filterParams={['issues']}>
            <AddIssueSection field="issues" issueType={IssueType.BUG} />
          </FilterContextProvider>

          <FilterContextProvider filterParams={['cves']}>
            <AddIssueSection field="cves" issueType={IssueType.CVE} />
          </FilterContextProvider>

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
          <TextColumnField
            name="references"
            label="References"
            noFooter
            isReadOnly
            onChange={(v) => setValue(references.value.filter?.((r) => v.includes(r)))}
          >
            {(props) => {
              return (
                <Grid>
                  <GridItem span={6}>
                    <InputField name={props.name} type={TextInputTypes.text} isDisabled />
                  </GridItem>
                  <GridItem span={6}>{props.removeButton}</GridItem>
                </Grid>
              );
            }}
          </TextColumnField>
          <TextInput
            name="reference"
            type={TextInputTypes.text}
            onChange={(_, val) => setReference(val)}
            value={reference}
          />
          <Button
            data-test="add-reference-button"
            variant="link"
            onClick={() => {
              void setValue([...references.value, reference]);
              setReference('');
            }}
            icon={<PlusCircleIcon />}
            isInline
            isDisabled={!reference}
          >
            {'Add reference'}
          </Button>
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
