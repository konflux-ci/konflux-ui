import * as React from 'react';
import CodeCommitSvg from '../../assets/code-commit.svg';
import CodePullRequestSvg from '../../assets/code-pull-request.svg';

import './CommitIcon.scss';

export const CommitIcon: React.FC<
  React.PropsWithChildren<{ isPR: boolean; className?: string }>
> = ({ isPR, className }) => {
  const IconComponent = isPR ? CodePullRequestSvg : CodeCommitSvg;
  const altText = isPR ? 'Pull request icon' : 'Commit icon';

  return <IconComponent className={`commit-icon ${className}`} aria-label={altText} />;
};
