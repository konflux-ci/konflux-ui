import * as React from 'react';
import {
  Button,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Tooltip,
  Truncate,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { useField } from 'formik';
import {
  MultiSelectComponentsDropdown,
  SingleSelectComponentDropdown,
} from './ComponentRelationshipDropdowns';
import { ComponentRelationNudgeType } from './type';

type ComponentRelationProps = {
  componentNames: string[];
  sortedGroupedComponents: { [application: string]: string[] };
  index?: number;
  removeProps: {
    disableRemove: boolean;
    onRemove: () => void;
  };
};

const TARGET_LABELS_VISIBLE = 3;

type ComponentRelationNudgeToggleProps = {
  index?: number;
  nudgeName: string;
  nudgeValue: ComponentRelationNudgeType;
  onNudgeChange: (value: ComponentRelationNudgeType) => void;
};

const ComponentRelationNudgeToggle: React.FC<ComponentRelationNudgeToggleProps> = ({
  index,
  nudgeName,
  nudgeValue,
  onNudgeChange,
}) => {
  return (
    <Flex gap={{ default: 'gapNone' }} role="group" aria-label="Nudge relationship type">
      <FlexItem>
        <Tooltip content="The component's builds propagate changes to the nudged component.">
          <Button
            id={`nudges-${index}`}
            type="button"
            name={nudgeName}
            variant={ComponentRelationNudgeType.NUDGES === nudgeValue ? 'primary' : 'control'}
            aria-pressed={ComponentRelationNudgeType.NUDGES === nudgeValue}
            onClick={() => onNudgeChange(ComponentRelationNudgeType.NUDGES)}
          >
            Nudges
          </Button>
        </Tooltip>
      </FlexItem>
      <FlexItem>
        <Tooltip content="The component will be changed by nudging component's build.">
          <Button
            id={`nudged-by-${index}`}
            type="button"
            name={nudgeName}
            variant={ComponentRelationNudgeType.NUDGED_BY === nudgeValue ? 'primary' : 'control'}
            aria-pressed={ComponentRelationNudgeType.NUDGED_BY === nudgeValue}
            onClick={() => onNudgeChange(ComponentRelationNudgeType.NUDGED_BY)}
          >
            Nudged by
          </Button>
        </Tooltip>
      </FlexItem>
    </Flex>
  );
};

export const ComponentRelation: React.FC<ComponentRelationProps> = ({
  index,
  componentNames,
  sortedGroupedComponents,
  removeProps: { disableRemove, onRemove },
}) => {
  const sourceName = `relations.${index.toString()}.source`;
  const nudgeName = `relations.${index.toString()}.nudgeType`;
  const targetName = `relations.${index.toString()}.target`;
  const [{ value: sourceValue }] = useField(sourceName);
  const [{ value: nudgeValue }, , { setValue: setNudgeValue }] = useField(nudgeName);
  const [{ value: targetValue }, , { setValue: setTargetValue }] = useField<string[]>(targetName);
  const [isTargetMenuOpen, setIsTargetMenuOpen] = React.useState(false);

  const visibleTargetValues = React.useMemo(
    () => targetValue.slice(0, TARGET_LABELS_VISIBLE),
    [targetValue],
  );
  const hiddenTargetCount = targetValue.length - visibleTargetValues.length;

  const handleNudgeChange = React.useCallback(
    (value: ComponentRelationNudgeType) => {
      void setNudgeValue(value);
    },
    [setNudgeValue],
  );

  const handleRemoveTarget = (component: string) => {
    void setTargetValue(targetValue.filter((item) => item !== component));
  };

  const handleShowMoreTargets = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsTargetMenuOpen(true);
  }, []);

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
      <FlexItem>
        <Flex gap={{ default: 'gapMd' }}>
          <FlexItem flex={{ default: 'flex_1' }}>
            <SingleSelectComponentDropdown
              name={sourceName}
              componentNames={componentNames}
              disableMenuItem={(item) => targetValue.includes(item)}
            />
          </FlexItem>
          <FlexItem>
            <ComponentRelationNudgeToggle
              index={index}
              nudgeName={nudgeName}
              nudgeValue={nudgeValue}
              onNudgeChange={handleNudgeChange}
            />
          </FlexItem>
          <FlexItem>
            <Button
              id={`remove-relation-${index}`}
              variant="plain"
              onClick={onRemove}
              isDisabled={disableRemove}
            >
              <MinusCircleIcon />
            </Button>
          </FlexItem>
        </Flex>
      </FlexItem>
      <FlexItem>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <MultiSelectComponentsDropdown
              name={targetName}
              sourceComponentName={sourceValue}
              sortedGroupedComponents={sortedGroupedComponents}
              isOpen={isTargetMenuOpen}
              onOpenChange={setIsTargetMenuOpen}
            />
          </FlexItem>
          {targetValue?.length > 0 ? (
            <FlexItem>
              <LabelGroup numLabels={targetValue.length} aria-label="Selected components to nudge">
                {visibleTargetValues.map((component) => (
                  <Label
                    key={component}
                    onClose={() => handleRemoveTarget(component)}
                    closeBtnAriaLabel={`Remove ${component}`}
                  >
                    <Truncate content={component} position="middle" />
                  </Label>
                ))}
                {hiddenTargetCount > 0 ? (
                  <Label
                    isOverflowLabel
                    onClick={handleShowMoreTargets}
                    aria-label={`Show ${hiddenTargetCount} more selected components`}
                  >
                    + {hiddenTargetCount} more
                  </Label>
                ) : null}
              </LabelGroup>
            </FlexItem>
          ) : null}
        </Flex>
      </FlexItem>
    </Flex>
  );
};
