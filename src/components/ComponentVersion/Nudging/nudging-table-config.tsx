import { Label } from '@patternfly/react-core';
import { ComponentLink } from '~/shared/components/component-link/ComponentLink';
import { type ColumnDefinition } from '~/shared/components/TableV2';
import { NudgeMode, NudgeRelationship } from '~/types';
import { getNudgeMode } from './nudging-utils';

export const getNudgingTableColumns = (
  direction: 'outgoing' | 'incoming',
  namespace: string,
): ColumnDefinition<NudgeRelationship>[] => [
  {
    id: 'component',
    header: 'Component',
    accessorFn: (row) => (direction === 'outgoing' ? row.to : row.from),
    size: 1,
    nonHidable: true,
    cell: (info) => (
      <span data-test="nudging-component-name">
        <ComponentLink namespace={namespace} name={info.getValue() as string} />
      </span>
    ),
  },
  {
    id: 'mode',
    header: 'Mode',
    accessorFn: (row) => getNudgeMode(row),
    size: 1,
    nonHidable: true,
    cell: (info) => {
      const mode = info.getValue() as NudgeMode;
      return (
        <Label color={mode === 'immediate' ? 'grey' : 'blue'} data-test="nudging-mode">
          {mode}
        </Label>
      );
    },
  },
  {
    id: 'gatingGroup',
    header: 'Gating group',
    accessorFn: (row) => row.gatingGroup,
    size: 1,
    nonHidable: true,
    cell: (info) => {
      const gatingGroup = info.getValue() as string;
      return <span data-test="nudging-gating-group">{gatingGroup ?? '-'}</span>;
    },
  },
];
