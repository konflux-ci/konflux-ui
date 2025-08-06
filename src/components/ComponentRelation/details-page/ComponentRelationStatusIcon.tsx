import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import relationIcon from '../../../assets/RelationsIcon.svg';
import { ComponentKind } from '../../../types';

import './ComponentRelationStatusIcon.scss';

export const ComponentRelationStatusIcon: React.FC<{
  component: ComponentKind;
  className?: string;
  style?: { [key: string]: unknown };
}> = ({ component, className, style }) => {
  const isInRelationship = !!(
    component.spec?.['build-nudges-ref']?.length ?? component.status?.['build-nudged-by']?.length
  );
  const RelationIcon = relationIcon;

  return isInRelationship ? (
    <Tooltip content="This component is in a relationship">
      <RelationIcon
        style={style}
        className={css('component-relation-status-icon', className)}
        src={relationIcon}
        alt="Component is in a relationship icon"
      />
    </Tooltip>
  ) : null;
};
