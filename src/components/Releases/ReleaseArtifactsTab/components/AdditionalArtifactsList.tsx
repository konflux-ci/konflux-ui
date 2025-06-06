import { Title } from '@patternfly/react-core';
import { ReleaseArtifacts } from '../../../../types';
import { renderKeyValueList } from '../utils/generic-key-value-rendering-utils';

type Props = {
  artifacts?: ReleaseArtifacts;
};

const KNOWN_KEYS = new Set(['index_image', 'github-release', 'images']);

export const AdditionalArtifactsList: React.FC<Props> = ({ artifacts }) => {
  const entries = Object.fromEntries(
    Object.entries(artifacts || {}).filter(([key]) => !KNOWN_KEYS.has(key)),
  );

  if (Object.keys(entries).length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <Title headingLevel="h5" size="md">
        Additional release artifacts
      </Title>
      <div style={{ marginTop: 20 }}>{renderKeyValueList(entries)}</div>
    </div>
  );
};
