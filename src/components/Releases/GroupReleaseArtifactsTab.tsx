import { useParams } from 'react-router-dom';
import {
  Bullseye,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Spinner,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { RouterParams } from '@routes/utils';
import { DetailsSection } from '~/components/DetailsPage';
import { AdditionalArtifactsList } from '~/components/Releases/ReleaseArtifactsTab/components/AdditionalArtifactsList';
import { ReleaseArtifactsEmptyState } from '~/components/Releases/ReleaseArtifactsTab/components/ReleaseArtifactsEmptyState';
import { ReleaseURLsDescriptionList } from '~/components/Releases/ReleaseArtifactsTab/components/ReleaseURLsDescriptionList';
import { getImageLink } from '~/components/Releases/ReleaseArtifactsTab/utils/url';
import { useRelease } from '~/hooks/useReleases';
import FilteredEmptyState from '~/shared/components/empty-state/FilteredEmptyState';
import {
  defineFilters,
  FilterToolbar,
  useFilteredData,
  useFilterState,
} from '~/shared/components/Filter';
import ExternalLink from '~/shared/components/links/ExternalLink';
import { ColumnDefinition, Table, TableContainer } from '~/shared/components/TableV2';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { ReleaseArtifactsImages } from '~/types';
import { textMatch } from '~/utils/text-filter-utils';

const filters = defineFilters<ReleaseArtifactsImages>()([
  {
    type: 'search',
    param: 'name',
    label: 'Name',
    filterFn: (image, value) => textMatch(image.name, value),
  },
]);
const columns: ColumnDefinition<ReleaseArtifactsImages>[] = [
  {
    id: 'name',
    header: 'Component',
    accessorFn: (image) => image.name,
    sortable: true,
    nonHidable: true,
  },
  {
    id: 'url',
    header: 'Container image',
    accessorFn: (image) => image.urls?.[0] ?? '-',
    sortable: true,
    cell: ({ row }) =>
      row.original.urls?.[0] ? (
        <ExternalLink href={getImageLink(row.original.urls[0])} text={row.original.urls[0]} />
      ) : (
        '-'
      ),
  },
  {
    id: 'arches',
    header: 'Architectures',
    accessorFn: (image) => image.arches?.join(', ') || '-',
    sortable: true,
  },
];
const AdditionalImageURLs = ({ image }: { image: ReleaseArtifactsImages }) => (
  <DescriptionList>
    <DescriptionListGroup>
      <DescriptionListTerm>Additional URLs</DescriptionListTerm>
      <DescriptionListDescription>
        <Stack hasGutter>
          {image.urls?.map((url) => (
            <StackItem key={url}>
              <ExternalLink href={getImageLink(url)} text={url} />
            </StackItem>
          ))}
        </Stack>
      </DescriptionListDescription>
    </DescriptionListGroup>
  </DescriptionList>
);

const GroupReleaseArtifactsTab = () => {
  const { releaseName } = useParams<RouterParams>();
  const namespace = useNamespace();
  const [release, loaded, error] = useRelease(namespace, releaseName);
  const images = release?.status?.artifacts?.images ?? [];
  const { clientFilterValues, clearAll } = useFilterState(filters);
  const { filteredData } = useFilteredData(filters, images, clientFilterValues);
  if (!loaded)
    return (
      <Bullseye>
        <Spinner size="lg" />
      </Bullseye>
    );
  if (error) return getErrorState(error, loaded, 'release');
  if (!release) return getErrorState({ code: 404 }, loaded, 'release');
  return (
    <DetailsSection title="Release artifacts">
      <Stack hasGutter className="pf-v6-u-mt-lg">
        <StackItem>
          <ReleaseURLsDescriptionList release={release} />
        </StackItem>
        <StackItem>
          <Title headingLevel="h5" size="md">
            Components
          </Title>
          <TableContainer
            data={filteredData}
            unfilteredData={images}
            loaded={loaded}
            toolbar={<FilterToolbar configs={filters} />}
            emptyState={<FilteredEmptyState onClearFilters={clearAll} />}
            noDataState={<ReleaseArtifactsEmptyState />}
          >
            <Table
              data={filteredData}
              columns={columns}
              getRowId={(image) => image.name}
              aria-label="Release artifacts"
              enableExpansion
              expandedContent={(image) => <AdditionalImageURLs image={image} />}
            />
          </TableContainer>
        </StackItem>
        <StackItem>
          <AdditionalArtifactsList artifacts={release.status?.artifacts} />
        </StackItem>
      </Stack>
    </DetailsSection>
  );
};
export default GroupReleaseArtifactsTab;
