import React, { useMemo } from 'react';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { useSortedGroupComponents } from '~/hooks/useComponents';
import { useAllComponentsV2 } from '~/hooks/useComponentsV2';
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

export const mergeCurrentComponentFlat = (
  componentNames: string[],
  current?: CurrentComponentRef,
): string[] => {
  if (!current?.componentName || componentNames.includes(current.componentName)) {
    return componentNames;
  }
  return [...componentNames, current.componentName].sort((a, b) => a.localeCompare(b));
};

const ComponentSelectorMenu: React.FC<{
  options: string[] | { [application: string]: string[] };
  currentComponent?: null | CurrentComponentRef;
}> = ({ options, currentComponent }) => (
  <div className="labeled-dropdown-field">
    <div className="title">Components</div>
    <div className="component-select-menu" data-test="component-select-menu">
      <ComponentSelectMenu
        defaultToggleText="Select components"
        selectedToggleText="Component"
        name="relatedComponents"
        defaultSelected={[currentComponent]}
        disableItem={(item) => item === currentComponent?.componentName}
        options={options}
        isMulti
        includeSelectAll
      />
    </div>
    <div className="help-text">
      <span>Tell us the components you want to link this secret to</span>
    </div>
  </div>
);

const ComponentSelectorV1: React.FC<ComponentSelectorProps> = ({ currentComponent }) => {
  const namespace = useNamespace();
  const [sortedGroupedComponents, loaded, error] = useSortedGroupComponents(namespace);
  const mergedGroupedComponents = useMemo(
    () =>
      loaded && !error ? mergeCurrentComponent(sortedGroupedComponents, currentComponent) : {},
    [sortedGroupedComponents, loaded, error, currentComponent],
  );

  return (
    <ComponentSelectorMenu
      currentComponent={currentComponent}
      options={loaded && !error ? mergedGroupedComponents : {}}
    />
  );
};

const ComponentSelectorV2: React.FC<ComponentSelectorProps> = ({ currentComponent }) => {
  const namespace = useNamespace();
  const [components, loaded, error] = useAllComponentsV2(namespace);
  const componentNames = useMemo(
    () =>
      loaded && !error
        ? mergeCurrentComponentFlat(
            (components ?? []).map((c) => c.metadata.name).sort((a, b) => a.localeCompare(b)),
            currentComponent,
          )
        : [],
    [components, loaded, error, currentComponent],
  );

  return <ComponentSelectorMenu currentComponent={currentComponent} options={componentNames} />;
};

export const ComponentSelector: React.FC<ComponentSelectorProps> = ({ currentComponent }) => {
  const useNewComponentModel = useIsOnFeatureFlag('component-model');
  return useNewComponentModel ? (
    <ComponentSelectorV2 currentComponent={currentComponent} />
  ) : (
    <ComponentSelectorV1 currentComponent={currentComponent} />
  );
};
