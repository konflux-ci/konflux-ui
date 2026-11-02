import * as React from 'react';
import {
  CodeBlock,
  CodeBlockCode,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
} from '@patternfly/react-core';

import './TaskRunInfrastructureDiagnostic.scss';

type Props = {
  message?: string;
};

const TaskRunInfrastructureDiagnostic: React.FC<Props> = ({ message }) => {
  if (!message) {
    return null;
  }

  return (
    <DescriptionListGroup>
      <DescriptionListTerm>Infrastructure diagnostic</DescriptionListTerm>
      <DescriptionListDescription>
        <CodeBlock>
          <CodeBlockCode className="task-run-infrastructure-diagnostic__code">
            {message}
          </CodeBlockCode>
        </CodeBlock>
      </DescriptionListDescription>
    </DescriptionListGroup>
  );
};

export default TaskRunInfrastructureDiagnostic;
