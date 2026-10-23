import { Content, ContentVariants } from '@patternfly/react-core';
import CommitLabel from '~/components/Commits/commit-label/CommitLabel';
import { Timestamp } from '~/shared/components/timestamp/Timestamp';
import { Commit } from '~/types';

type Props = {
  name: string;
  creationTimestamp?: string;
  commit?: Commit;
};

const SnapshotDetailsTitle = ({ name, creationTimestamp, commit }: Props) => (
  <>
    <Content component={ContentVariants.h2} data-test="snapshot-name">
      {name}
    </Content>
    {commit?.sha && (
      <Content component={ContentVariants.p} data-test="snapshot-header-details">
        Triggered by {commit.shaTitle}{' '}
        <CommitLabel gitProvider={commit.gitProvider} sha={commit.sha} shaURL={commit.shaURL} /> at{' '}
        <Timestamp timestamp={creationTimestamp} className="pf-v6-u-display-inline" />
      </Content>
    )}
  </>
);

export default SnapshotDetailsTitle;
