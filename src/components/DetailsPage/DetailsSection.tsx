import * as React from 'react';
import { HelperText, HelperTextItem, Title } from '@patternfly/react-core';

import './DetailsSection.scss';

type DetailsSectionProps = {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
};

export const DetailsSection: React.FC<React.PropsWithChildren<DetailsSectionProps>> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="details-section">
      {title ? (
        <Title headingLevel="h4" className="details-section__title" size="lg">
          {title}
        </Title>
      ) : null}
      {description ? (
        <HelperText>
          <HelperTextItem variant="indeterminate" className="details-section__description">
            {description}
          </HelperTextItem>
        </HelperText>
      ) : null}
      {children}
    </div>
  );
};
