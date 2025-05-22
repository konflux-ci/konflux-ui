import React from 'react';
import { useSortedGroupComponents } from '~/hooks/useComponents';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';
import { useNamespace } from '~/shared/providers/Namespace';

export const ComponentSelector: React.FC = () => {
  const namespace = useNamespace();
  const [sortedGroupedComponents, loaded, error] = useSortedGroupComponents(namespace);

  return (
    <div className="labeled-dropdown-field">
      <div className="title">Components</div>
      <div className="component-select-menu" data-test="component-select-menu">
        <ComponentSelectMenu
          defaultToggleText="Selecting"
          selectedToggleText="Component"
          name="relatedComponents"
          options={
            loaded && !error ? sortedGroupedComponents : ({} as { [application: string]: string[] })
          }
          isMulti
          includeSelectAll
        />
      </div>
      <div className="help-text">
        <span>Tell us the components you want to link this secret to</span>
      </div>
    </div>
  );
};
