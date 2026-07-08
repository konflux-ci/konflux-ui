import {
  FormSection,
  HelperText,
  HelperTextItem,
  Text,
  TextContent,
  TextVariants,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { InputField } from 'formik-pf';
import { useNamespace } from '../../../shared/providers/Namespace';
import GitRepoLink from '../../GitLink/GitRepoLink';
import { ImportFormValues } from '../type';
import { SourceSection } from './SourceSection';

import './ComponentSection.scss';

export const ComponentSection = () => {
  const { values } = useFormikContext<ImportFormValues>();
  const namespace = useNamespace();
  return (
    <FormSection>
      <TextContent>
        <Text component={TextVariants.h3}>Component details</Text>
        <Text component={TextVariants.p}>
          A component is an image built from source code repository.
        </Text>
      </TextContent>
      <SourceSection />
      <InputField
        name="source.git.dockerfileUrl"
        label="Docker file"
        placeholder="/path/to/Dockerfile"
      />
      <InputField
        name="componentName"
        label="Component name"
        isRequired
        data-test="component-name"
      />
      <HelperText>
        <HelperTextItem>
          Must be unique within tenant namespace{' '}
          <span className="component-section__component-name__helper-text">{namespace}</span>
        </HelperTextItem>
      </HelperText>
      {values.source.git.url ? (
        <GitRepoLink
          url={values.source.git.url}
          revision={values.source.git.revision}
          context={values.source.git.context}
        />
      ) : null}
    </FormSection>
  );
};
