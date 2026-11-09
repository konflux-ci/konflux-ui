import * as React from 'react';
import {
  Alert,
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  MenuList,
  MenuItem,
  ModalVariant,
  Spinner,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons/dist/esm/icons/cubes-icon';
import { useComponentV2 } from '~/hooks/useComponentsV2';
import SelectComponentsDropdown from '~/shared/components/component-select-menu/SelectComponnetsDropdown';
import { ComponentProps, createModalLauncher } from '~/shared/components/modal/createModalLauncher';
import { useNamespace } from '~/shared/providers/Namespace';
import { getErrorState } from '~/shared/utils/error-utils';
import { startNewBuildV2 } from '~/utils/component-utils';

type StartNewBuildModalProps = ComponentProps & {
  componentName: string;
};

export const StartNewBuildModal: React.FC<React.PropsWithChildren<StartNewBuildModalProps>> = ({
  onClose,
  componentName,
}) => {
  const namespace = useNamespace();
  const [component, loaded, error] = useComponentV2(namespace, componentName);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [submitError, setSubmitError] = React.useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const versionNames = React.useMemo(
    () =>
      (component?.spec?.source?.versions ?? [])
        .map((v) => v.name)
        .sort((a, b) => a.localeCompare(b)),
    [component],
  );

  const toggleVersion = (version: string) =>
    setSelected((prev) =>
      prev.includes(version) ? prev.filter((v) => v !== version) : [...prev, version],
    );

  const handleSubmit = async () => {
    setSubmitError(undefined);
    setIsSubmitting(true);
    try {
      await startNewBuildV2(namespace, componentName, selected);
      onClose?.();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to start build');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner data-test="spinner" />
      </Bullseye>
    );
  }

  if (error) {
    return getErrorState(error, loaded, 'component');
  }

  if (versionNames.length === 0) {
    return (
      <EmptyState headingLevel="h2" icon={CubesIcon} titleText="No versions to build">
        <EmptyStateBody>This component has no versions to build.</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Flex direction={{ default: 'column' }}>
      <FlexItem>Select the versions to build:</FlexItem>
      <FlexItem>
        <div data-test="start-build-version-select">
          <SelectComponentsDropdown
            toggleText={selected.length ? `${selected.length} selected` : 'Select versions'}
            onSelect={toggleVersion}
          >
            <MenuList>
              {versionNames.map((version) => (
                <MenuItem
                  key={version}
                  itemId={version}
                  hasCheckbox
                  isSelected={selected.includes(version)}
                >
                  {version}
                </MenuItem>
              ))}
            </MenuList>
          </SelectComponentsDropdown>
        </div>
      </FlexItem>
      {selected.length > 0 && (
        <FlexItem>
          <LabelGroup data-test="start-build-selected-versions">
            {selected.map((version) => (
              <Label key={version} onClose={() => toggleVersion(version)}>
                {version}
              </Label>
            ))}
          </LabelGroup>
        </FlexItem>
      )}
      {submitError && (
        <FlexItem>
          <Alert
            variant="danger"
            title="Failed to start build"
            isInline
            isLiveRegion
            data-test="start-build-error"
          >
            {submitError}
          </Alert>
        </FlexItem>
      )}
      <Flex gap={{ default: 'gapSm' }}>
        <FlexItem>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isDisabled={selected.length === 0 || isSubmitting}
            isLoading={isSubmitting}
            data-test="start-build-submit"
          >
            Start build
          </Button>
        </FlexItem>
        <FlexItem>
          <Button variant="tertiary" onClick={() => onClose?.()} isDisabled={isSubmitting}>
            Cancel
          </Button>
        </FlexItem>
      </Flex>
    </Flex>
  );
};

export const createStartNewBuildModalLauncher = (componentName: string) =>
  createModalLauncher(StartNewBuildModal, {
    'data-test': 'start-new-build-modal',
    variant: ModalVariant.small,
    title: 'Start new build',
  })({ componentName });
