import { EmptyStateBody } from '@patternfly/react-core';
import emptyStateImgUrl from '../../assets/Pipeline.svg';
import AppEmptyState from '../../shared/components/empty-state/AppEmptyState';

const PipelineRunEmptyStateV2 = () => {
  return (
    <AppEmptyState emptyStateImg={emptyStateImgUrl} title="Keep tabs on components and activity">
      <EmptyStateBody>
        Monitor your components with pipelines and oversee CI/CD activity.
      </EmptyStateBody>
    </AppEmptyState>
  );
};

export default PipelineRunEmptyStateV2;
