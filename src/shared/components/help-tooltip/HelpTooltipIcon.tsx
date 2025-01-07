import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';

type HelpTooltipProps = {
  content: React.ReactNode;
};

const HelpTooltipIcon: React.FC<React.PropsWithChildren<HelpTooltipProps>> = ({ content }) => (
  <Tooltip content={content}>
    <OutlinedQuestionCircleIcon />
  </Tooltip>
);

export default HelpTooltipIcon;
