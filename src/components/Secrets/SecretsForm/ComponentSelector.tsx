import React, { useMemo } from 'react';
import { useSortedGroupComponents } from '~/hooks/useComponents';
import { ComponentSelectMenu } from '~/shared/components/component-select-menu/ComponentSelectMenu';
import { useNamespace } from '~/shared/providers/Namespace';
import { CurrentComponentRef } from '~/types';

type ComponentSelectorProps = {
  currentComponent?: null | CurrentComponentRef;
};

export const mergeCurrentComponent = (
  sortedGroupedComponents: { [application: string]: string[] },
  current?: CurrentComponentRef,
): { [application: string]: string[] } => {
  if (!current) return sortedGroupedComponents;
  const { applicationName, componentName } = current;
  if (!applicationName || !componentName) return sortedGroupedComponents;

  const copy = { ...sortedGroupedComponents };

  if (!copy[applicationName]) {
    copy[applicationName] = [componentName];
  } else if (!copy[applicationName].includes(componentName)) {
    copy[applicationName] = [...copy[applicationName], componentName];
  }

  Object.keys(copy).forEach((app) => {
    copy[app].sort((a, b) => a.localeCompare(b));
  });

  const sortedKeys = Object.keys(copy).sort((a, b) => a.localeCompare(b));
  const sortedResult: { [application: string]: string[] } = {};
  for (const key of sortedKeys) {
    sortedResult[key] = copy[key];
  }

  return sortedResult;
};

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({ currentComponent }) => {
  const namespace = useNamespace();
  const [sortedGroupedComponents, loaded, error] = useSortedGroupComponents(namespace);
  const mergedGroupedComponents = useMemo(
    () =>
      loaded && !error ? mergeCurrentComponent(sortedGroupedComponents, currentComponent) : {},
    [sortedGroupedComponents, loaded, error, currentComponent],
  );

  return (
    <div className="labeled-dropdown-field">
      <div className="title">Components</div>
      <div className="component-select-menu" data-test="component-select-menu">
        <ComponentSelectMenu
          defaultToggleText="Selecting"
          selectedToggleText="Component"
          name="relatedComponents"
          defaultSelected={[currentComponent]}
          disableItem={(item) => item === currentComponent?.componentName}
          options={
            loaded && !error ? mergedGroupedComponents : ({} as { [application: string]: string[] })
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
