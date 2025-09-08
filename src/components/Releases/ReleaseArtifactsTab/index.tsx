import * as React from 'react';
import { useParams } from 'react-router-dom';
import { Bullseye, debounce, Spinner, Stack, StackItem, Title } from '@patternfly/react-core';
import { SortByDirection } from '@patternfly/react-table';
import { useRelease } from '../../../hooks/useReleases';
import { useSearchParam } from '../../../hooks/useSearchParam';
import { useSortedResources } from '../../../hooks/useSortedResources';
import { RouterParams } from '../../../routes/utils';
import { Table } from '../../../shared';
import { useNamespace } from '../../../shared/providers/Namespace';
import { ReleaseArtifactsImages } from '../../../types';
import { DetailsSection } from '../../DetailsPage';
import { AdditionalArtifactsList } from './components/AdditionalArtifactsList';
import { ReleaseArtifactsEmptyState } from './components/ReleaseArtifactsEmptyState';
import { ReleaseURLsDescriptionList } from './components/ReleaseURLsDescriptionList';
import { ReleaseArtifactsListExpandedRow } from './ReleaseArtifactsListExpandedRow';
import getListHeader, { SortableHeaders } from './ReleaseArtifactsListHeader';
import { ReleaseArtifactsListRow } from './ReleaseArtifactsListRow';
import { ReleaseArtifactsToolbar } from './ReleaseArtifactsToolbar';

import './ReleaseArtifactsList.scss';

const sortPaths: Record<SortableHeaders, string> = {
  [SortableHeaders.componentName]: 'name',
  [SortableHeaders.url]: 'urls',
  [SortableHeaders.arches]: 'arches',
};

const ReleaseArtifactsTab: React.FC = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, releaseLoaded] = useRelease(namespace, releaseName);

  const [activeSortIndex, setActiveSortIndex] = React.useState<number>(
    SortableHeaders.componentName,
  );
  const [activeSortDirection, setActiveSortDirection] = React.useState<SortByDirection>(
    SortByDirection.asc,
  );

  const artifactsImages = React.useMemo(
    () => release?.status?.artifacts?.images,
    [release?.status?.artifacts?.images],
  );

  const sortedArtifactsImages = useSortedResources(
    artifactsImages,
    activeSortIndex,
    activeSortDirection,
    sortPaths,
  );

  const ArtifactsListHeader = React.useMemo(
    () =>
      getListHeader(activeSortIndex, activeSortDirection, (_, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction);
      }),
    [activeSortDirection, activeSortIndex],
  );

  const [nameFilter, setNameFilter] = useSearchParam('name', '');
  const handleNameFilterChange = debounce((n: string) => {
    setNameFilter(n);
  }, 600);

  const filteredArtifactsImages = React.useMemo(() => {
    const lowerCaseNameFilter = nameFilter.toLowerCase();
    return sortedArtifactsImages?.filter((image) =>
      image.name?.toLowerCase().includes(lowerCaseNameFilter),
    );
  }, [nameFilter, sortedArtifactsImages]);

  if (!releaseLoaded) {
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  }

  return (
    <>
      <DetailsSection title="Release artifacts">
        <Stack style={{ marginTop: 'var(--pf-v5-global--spacer--2xl)' }}>
          <StackItem>
            <ReleaseURLsDescriptionList release={release} />
          </StackItem>
          <StackItem style={{ paddingTop: 'var(--pf-v5-global--spacer--xl)' }}>
            <Title headingLevel="h5" size="md">
              Components
            </Title>
            <Table
              virtualize
              data={filteredArtifactsImages}
              unfilteredData={sortedArtifactsImages}
              NoDataEmptyMsg={ReleaseArtifactsEmptyState}
              aria-label="Release Artifacts List"
              Header={ArtifactsListHeader}
              Toolbar={
                <ReleaseArtifactsToolbar
                  value={nameFilter}
                  onSearchInputChange={handleNameFilterChange}
                />
              }
              Row={(props) => {
                const obj = props.obj as ReleaseArtifactsImages;
                return <ReleaseArtifactsListRow {...props} obj={obj} />;
              }}
              loaded={releaseLoaded}
              getRowProps={(obj: ReleaseArtifactsImages) => ({
                id: `${obj.name}-release-artifacts-list-item`,
                'aria-label': obj.name,
              })}
              expand
              ExpandedContent={(props) => {
                const releaseArtifactImage = props.obj as ReleaseArtifactsImages;
                return (
                  <ReleaseArtifactsListExpandedRow releaseArtifactImage={releaseArtifactImage} />
                );
              }}
            />
          </StackItem>

          <StackItem>
            <AdditionalArtifactsList artifacts={release?.status?.artifacts} />
          </StackItem>
        </Stack>
      </DetailsSection>
    </>
  );
};

export default ReleaseArtifactsTab;
