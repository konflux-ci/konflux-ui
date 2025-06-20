import React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
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
        <Text component={TextVariants.p}>{releaseArtifactImage.name}</Text>
      </TableData>

      <TableData className={`${releaseArtifactsTableColumnClasses.url} vertical-center-cell`}>
        {releaseArtifactImage.urls ? (
          <ExternalLink
            href={getImageLink(releaseArtifactImage.urls[0])}
            text={releaseArtifactImage.urls[0]}
            stopPropagation
          />
        ) : (
          <Text component={TextVariants.p}> - </Text>
        )}
      </TableData>

      <TableData className={`${releaseArtifactsTableColumnClasses.arches} vertical-center-cell`}>
        {releaseArtifactImage.arches ? (
          <Text component={TextVariants.p}>{releaseArtifactImage.arches.join(', ')}</Text>
        ) : (
          <Text component={TextVariants.p}> - </Text>
        )}
      </TableData>
    </>
  );
};
