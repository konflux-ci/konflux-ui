import { useParams } from 'react-router-dom';
import SnapshotsListView from '~/components/Snapshots/SnapshotsListView/SnapshotsListView';
import { RouterParams } from '~/routes/utils';

const ComponentGroupSnapshotsTab = () => {
  const { groupName } = useParams<RouterParams>();
  return <SnapshotsListView groupName={groupName} />;
};

export default ComponentGroupSnapshotsTab;
