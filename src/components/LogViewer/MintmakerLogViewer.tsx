import { FC, PropsWithChildren, useCallback } from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Flex,
  FlexItem,
  ModalVariant,
} from '@patternfly/react-core';
import { ComponentProps, createModalLauncher } from '~/components/modal/createModalLauncher';
import { useModalLauncher } from '~/components/modal/ModalProvider';
import { PipelineRunLabel } from '~/consts/pipelinerun';
import { Timestamp } from '~/shared';
import { PipelineRunKind } from '~/types';
import { MintmakerLogs } from './MintmakerLogs';

import './MintmakerLogViewer.scss';

type MintmakerLogViewerProps = ComponentProps & {
  dependencyRun: PipelineRunKind;
};

export const MintmakerLogViewer: FC<PropsWithChildren<MintmakerLogViewerProps>> = ({
  dependencyRun,
}) => (
  <Flex direction={{ default: 'column' }} className="mintmaker-log-viewer__content">
    <FlexItem>
      <DescriptionList data-test="mintmaker-run-details" columnModifier={{ default: '3Col' }}>
        <DescriptionListGroup>
          <DescriptionListTerm>Component</DescriptionListTerm>
          <DescriptionListDescription>
            {dependencyRun.metadata?.labels?.[PipelineRunLabel.MINTMAKER_COMPONENT_LABEL] ?? '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Mintmaker pipeline run</DescriptionListTerm>
          <DescriptionListDescription>
            {dependencyRun.metadata?.name ?? '-'}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>Started</DescriptionListTerm>
          <DescriptionListDescription>
            <Timestamp timestamp={dependencyRun.status?.startTime ?? '-'} />
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </FlexItem>
    <FlexItem flex={{ default: 'flex_1' }} className="mintmaker-log-viewer__body">
      <MintmakerLogs dependencyRun={dependencyRun} />
    </FlexItem>
  </Flex>
);

export const mintmakerLogViewerLauncher = createModalLauncher(MintmakerLogViewer, {
  className: 'mintmaker-log-viewer',
  'data-test': 'view-mintmaker-logs-modal',
  variant: ModalVariant.large,
});

export const useMintmakerLogViewerModal = (dependencyRun: PipelineRunKind) => {
  const showModal = useModalLauncher();
  return useCallback(
    () => showModal(mintmakerLogViewerLauncher({ dependencyRun })),
    [dependencyRun, showModal],
  );
};
