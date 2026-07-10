import * as React from 'react';
import {
  Button,
  Flex,
  FlexItem,
  Label,
  LabelGroup,
  Truncate,
} from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { useField } from 'formik';
import { SegmentedToggle } from '~/shared/components/segmented-toggle';
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

const getNudgeToggleOptions = (index?: number) => [
  {
    value: ComponentRelationNudgeType.NUDGES,
    label: 'Nudges',
    tooltip: "The component's builds propagate changes to the nudged component.",
    id: `nudges-${index}`,
  },
  {
    value: ComponentRelationNudgeType.NUDGED_BY,
    label: 'Nudged by',
    tooltip: "The component will be changed by nudging component's build.",
    id: `nudged-by-${index}`,
  },
];

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
            <SegmentedToggle
              aria-label="Nudge relationship type"
              name={nudgeName}
              value={nudgeValue}
              onChange={(value) => void setNudgeValue(value)}
              options={getNudgeToggleOptions(index)}
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
