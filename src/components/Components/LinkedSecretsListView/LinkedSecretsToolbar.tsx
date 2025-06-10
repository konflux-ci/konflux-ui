import { SearchInput, Toolbar, ToolbarContent, ToolbarItem } from '@patternfly/react-core';
import { LinkSecretView } from '~/components/Components/LinkSecret/LinkSecretView';
import { useSearchParam } from '../../../hooks/useSearchParam';

export const LinkedSecretsToolbar: React.FC = () => {
  const [nameFilter, setNameFilter] = useSearchParam('name', '');

  return (
    <Toolbar
      data-test="linked-secrets-list-toolbar"
      clearFiltersButtonText="Clear filters"
      clearAllFilters={() => setNameFilter('')}
    >
      <ToolbarContent>
        <ToolbarItem>
          <SearchInput
            name="nameInput"
            data-test="name-input-filter"
            type="search"
            aria-label="name filter"
            placeholder="Filter by name..."
            onChange={(_, name) => setNameFilter(name)}
            value={nameFilter}
          />
        </ToolbarItem>
        <ToolbarItem>
          <LinkSecretView />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};
