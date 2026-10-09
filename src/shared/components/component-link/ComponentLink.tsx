import { Link } from 'react-router-dom';
import BranchIcon from '@patternfly/react-icons/dist/esm/icons/code-branch-icon';
import { COMPONENT_DETAILS_V2_PATH } from '@routes/paths';

type ComponentLinkProps = {
  namespace: string;
  name: string;
  version?: string;
};

export const ComponentLink: React.FC<ComponentLinkProps> = ({ namespace, name, version }) => (
  <Link
    to={COMPONENT_DETAILS_V2_PATH.createPath({ workspaceName: namespace, componentName: name })}
  >
    {name}
    {version && (
      <>
        (<BranchIcon aria-hidden="true" /> {version})
      </>
    )}
  </Link>
);
