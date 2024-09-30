import * as React from 'react';
import { useComponent } from '../../hooks/useComponents';
import { RawComponentProps } from '../modal/createModalLauncher';
import { useWorkspaceInfo } from '../Workspace/workspace-context';
import CustomizePipeline from './CustomizePipelines';

type Props = RawComponentProps & {
  namespace: string;
  name: string;
};

const CustomizeComponentPipeline: React.FC<React.PropsWithChildren<Props>> = ({
  namespace,
  name,
  onClose,
  modalProps,
}) => {
  const { workspace } = useWorkspaceInfo();
  const [watchedComponent, loaded] = useComponent(namespace, workspace, name, true);
  if (loaded && watchedComponent) {
    return (
      <CustomizePipeline
        components={[watchedComponent]}
        onClose={onClose}
        modalProps={modalProps}
        singleComponent
      />
    );
  }
  return null;
};

export default CustomizeComponentPipeline;
