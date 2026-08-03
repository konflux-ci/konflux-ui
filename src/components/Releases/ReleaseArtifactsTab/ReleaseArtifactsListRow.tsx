import React from 'react';
import { Content, ContentVariants } from '@patternfly/react-core';
import { ExternalLink, RowFunctionArgs, TableData } from '../../../shared';
import { ReleaseArtifactsImages } from '../../../types';
import { releaseArtifactsTableColumnClasses } from './ReleaseArtifactsListHeader';
import { getImageLink } from './utils/url';

import './ReleaseArtifactsList.scss';

type Props = RowFunctionArgs<ReleaseArtifactsImages>;

export const ReleaseArtifactsListRow: React.FC<Props> = ({ obj: releaseArtifactImage }) => {
  return (
    <>
      <TableData
        className={`${releaseArtifactsTableColumnClasses.componentName} vertical-center-cell`}
      >
        <Content component={ContentVariants.p}>{releaseArtifactImage.name}</Content>
      </TableData>

      <TableData className={`${releaseArtifactsTableColumnClasses.url} vertical-center-cell`}>
        {releaseArtifactImage.urls ? (
          <ExternalLink
            href={getImageLink(releaseArtifactImage.urls[0])}
            text={releaseArtifactImage.urls[0]}
            stopPropagation
          />
        ) : (
          <Content component={ContentVariants.p}> - </Content>
        )}
      </TableData>

      <TableData className={`${releaseArtifactsTableColumnClasses.arches} vertical-center-cell`}>
        {releaseArtifactImage.arches ? (
          <Content component={ContentVariants.p}>{releaseArtifactImage.arches.join(', ')}</Content>
        ) : (
          <Content component={ContentVariants.p}> - </Content>
        )}
      </TableData>
    </>
  );
};
