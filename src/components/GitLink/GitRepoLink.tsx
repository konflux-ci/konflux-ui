import * as React from 'react';
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
import { CodeBranchIcon } from '@patternfly/react-icons/dist/esm/icons/code-branch-icon';
import gitUrlParse from 'git-url-parse';
import ExternalLink from '../../shared/components/links/ExternalLink';
import { getGitIcon, getGitPath } from '../../utils/git-utils';

type Props = {
  url: string;
  revision?: string;
  context?: string;
  dataTestID?: string;
};

const GitRepoLink: React.FC<React.PropsWithChildren<Props>> = ({
  url,
  revision,
  context,
  dataTestID,
}) => {
  let parsed: gitUrlParse.GitUrl;
  try {
    parsed = gitUrlParse(url);
  } catch {
    return null;
  }
  const icon = getGitIcon(parsed.source as string);
  const path = context?.replace(/^(\.?\/)?/g, '');
  const fullUrl = `https://${parsed.resource}/${parsed.owner}/${parsed.name}${getGitPath(
    parsed.source as string,
    revision,
    path,
    parsed.resource as string,
  )}`;

  return (
    <Tooltip content={fullUrl} position={TooltipPosition.bottom}>
      <ExternalLink href={fullUrl} icon={icon} hideIcon dataTestID={dataTestID} isHighlightable>
        {parsed.owner}/{parsed.name}
        {revision ? (
          <>
            {' '}
            (<CodeBranchIcon />
            {revision}
            {path ? ` / ${path}` : ''})
          </>
        ) : path ? (
          ` (${path})`
        ) : (
          ''
        )}
      </ExternalLink>
    </Tooltip>
  );
};

export default GitRepoLink;
