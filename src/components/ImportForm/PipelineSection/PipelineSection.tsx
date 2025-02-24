import * as React from 'react';
import { useFormikContext } from 'formik';
import { useBuildPipelineConfig } from '../../../hooks/useBuildPipelineConfig';
import DropdownField from '../../../shared/components/formik-fields/DropdownField';
import { ImportFormValues } from '../type';

export const PipelineSection: React.FunctionComponent = () => {
  const { values, setFieldValue } = useFormikContext<ImportFormValues>();
  const [pipelineTemplate, loaded] = useBuildPipelineConfig();

  React.useEffect(() => {
    if (loaded && pipelineTemplate?.defaultPipelineName && values?.pipeline === '') {
      void setFieldValue('pipeline', pipelineTemplate?.defaultPipelineName);
    }
  }, [loaded, setFieldValue, pipelineTemplate?.defaultPipelineName, values?.pipeline]);

  const dropdownItems = React.useMemo(() => {
    return loaded
      ? pipelineTemplate?.pipelines.map((t) => ({
          key: t.name,
          value: t.name,
          description: t?.description,
        }))
      : [];
  }, [loaded, pipelineTemplate?.pipelines]);

  return (
    <DropdownField
      name="pipeline"
      label="Pipeline"
      data-test="secret-type-selector"
      items={dropdownItems}
      placeholder={!loaded ? 'Loading pipelines...' : 'Select a Pipeline'}
      isDisabled={!loaded}
      required
      validateOnChange
    />
  );
};
