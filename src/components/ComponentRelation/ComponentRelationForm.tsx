import * as React from 'react';
import { Bullseye, Button, Flex, FlexItem, Grid, GridItem, Radio } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { useField } from 'formik';
import { HelpTooltipIcon } from '../../shared';
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
  const [{ value: targetValue }] = useField(targetName);

  const handleNudgeChange = React.useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      const value = (e.target as HTMLInputElement).value;
      void setNudgeValue(value);
    },
    [setNudgeValue],
  );
  return (
    <Grid hasGutter>
      <GridItem span={4}>
        <SingleSelectComponentDropdown
          name={sourceName}
          componentNames={componentNames}
          disableMenuItem={(item) => targetValue.includes(item)}
        />
      </GridItem>
      <GridItem span={3}>
        <Bullseye>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
              <Radio
                id={`nudges-${index}`}
                isChecked={ComponentRelationNudgeType.NUDGES === nudgeValue}
                name={nudgeName}
                label={
                  <b>
                    Nudges{' '}
                    <HelpTooltipIcon content="The component's builds propogate changes to the nudged component." />
                  </b>
                }
                value={ComponentRelationNudgeType.NUDGES}
                onChange={handleNudgeChange}
                style={{ marginRight: 0 }}
              />
            </Flex>
            <Flex justifyContent={{ default: 'justifyContentFlexStart' }}>
              <Radio
                id={`nudged-by-${index}`}
                isChecked={ComponentRelationNudgeType.NUDGED_BY === nudgeValue}
                name={nudgeName}
                label={
                  <b key={index.toString()}>
                    Is nudged by{' '}
                    <HelpTooltipIcon content="The component will be changed by nudging component's build." />
                  </b>
                }
                value={ComponentRelationNudgeType.NUDGED_BY}
                onChange={handleNudgeChange}
                style={{ marginRight: 0 }}
              />
            </Flex>
          </FlexItem>
        </Bullseye>
      </GridItem>
      <GridItem span={4}>
        <MultiSelectComponentsDropdown
          name={targetName}
          sourceComponentName={sourceValue}
          sortedGroupedComponents={sortedGroupedComponents}
        />
      </GridItem>
      <GridItem span={1}>
        <Button
          id={`remove-relation-${index}`}
          variant="plain"
          onClick={onRemove}
          isDisabled={disableRemove}
        >
          <MinusCircleIcon />
        </Button>
      </GridItem>
    </Grid>
  );
};
