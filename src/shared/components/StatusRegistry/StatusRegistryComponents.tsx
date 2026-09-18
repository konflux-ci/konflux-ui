/**
 * Generic React helpers for the status registry system.
 * Resource-agnostic — works with any registry from `createStatusRegistry`.
 */

import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-triangle-icon';
import { css } from '@patternfly/react-styles';
import {
  getRunStatusModifier,
  RunStatus,
  StatusIcon as PfStatusIcon,
} from '@patternfly/react-topology';
import pipelineStyles from '@patternfly/react-topology/dist/esm/css/topology-pipelines';
import type { FilterOption } from '~/shared/components/Filter/types';
import type { StatusCategory, StatusRegistry } from '~/shared/utils/status-registry';

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

type StatusDisplayResult<TStatus extends string> = {
  status: TStatus | null;
  label: string;
  category: StatusCategory;
  color: string;
  colorName: string;
  runStatus: RunStatus;
};

export function useStatusDisplay<TStatus extends string, TResource, TContext>(
  registry: StatusRegistry<TStatus, TResource, TContext>,
  resource: TResource | null | undefined,
): StatusDisplayResult<TStatus> {
  return React.useMemo(() => {
    if (!resource) {
      return {
        status: null,
        label: '',
        category: 'neutral' as StatusCategory,
        color: '',
        colorName: '',
        runStatus: RunStatus.Pending,
      };
    }
    const status = registry.deriveStatus(resource);
    return {
      status,
      label: registry.getLabel(status),
      category: registry.getCategory(status),
      color: registry.getColor(status),
      colorName: registry.getColorName(status),
      runStatus: registry.getRunStatus(status),
    };
  }, [registry, resource]);
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

type RegistryStatusIconProps<TStatus extends string, TResource, TContext> = {
  registry: StatusRegistry<TStatus, TResource, TContext>;
  status: TStatus;
  height?: number;
  width?: number;
};

export function RegistryStatusIcon<TStatus extends string, TResource, TContext>({
  registry,
  status,
  ...props
}: RegistryStatusIconProps<TStatus, TResource, TContext>): React.ReactElement {
  const pfRunStatus = registry.getRunStatus(status);

  // Cancelling-like statuses: use warning icon instead of default cancelled icon
  if (pfRunStatus === RunStatus.Cancelled && registry.hasTag(status, 'unfinished')) {
    return (
      <span
        className={css(
          pipelineStyles.topologyPipelinesStatusIcon,
          getRunStatusModifier(RunStatus.Cancelled),
        )}
      >
        <ExclamationTriangleIcon {...props} />
      </span>
    );
  }

  return <PfStatusIcon status={pfRunStatus} {...props} />;
}

type RegistryStatusIconWithTextProps<TStatus extends string, TResource, TContext> = {
  registry: StatusRegistry<TStatus, TResource, TContext>;
  status: TStatus;
  text?: string;
  dataTestAttribute?: string;
};

export function RegistryStatusIconWithText<TStatus extends string, TResource, TContext>({
  registry,
  status,
  text,
  dataTestAttribute,
}: RegistryStatusIconWithTextProps<TStatus, TResource, TContext>): React.ReactElement {
  const pfRunStatus = registry.getRunStatus(status);
  const label = text ?? registry.getLabel(status);
  const isActive = registry.hasTag(status, 'active');

  return (
    <span className="status-icon-with-text">
      <span
        className={css(
          'pf-v6-u-mr-xs status-icon',
          pipelineStyles.topologyPipelinesPillStatus,
          isActive && 'icon-spin',
          getRunStatusModifier(pfRunStatus),
        )}
      >
        <RegistryStatusIcon registry={registry} status={status} />
      </span>
      <span data-test={dataTestAttribute}>{label}</span>
    </span>
  );
}

type RegistryStatusIconWithTextLabelProps<TStatus extends string, TResource, TContext> = {
  registry: StatusRegistry<TStatus, TResource, TContext>;
  status: TStatus;
  text?: string;
};

export function RegistryStatusIconWithTextLabel<TStatus extends string, TResource, TContext>({
  registry,
  status,
  text,
}: RegistryStatusIconWithTextLabelProps<TStatus, TResource, TContext>): React.ReactElement {
  return (
    <Label color={registry.getColorName(status)} variant="outline">
      <RegistryStatusIconWithText registry={registry} status={status} text={text} />
    </Label>
  );
}

// ---------------------------------------------------------------------------
// Filter options
// ---------------------------------------------------------------------------

export function buildStatusFilterOptions<TStatus extends string, TResource, TContext>(
  registry: StatusRegistry<TStatus, TResource, TContext>,
  exclude?: ReadonlySet<TStatus>,
): FilterOption[] {
  const configs = registry.getStatusConfigs(exclude);
  return configs.map((config) => ({
    label: config.label,
    value: config.status as string,
    icon: (
      <span
        style={{
          color: registry.getColor(config.status),
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <PfStatusIcon status={registry.getRunStatus(config.status)} height={12} width={12} />
      </span>
    ),
  }));
}

// ---------------------------------------------------------------------------
// Factory: bind a registry once, get a namespace of pre-bound exports
// ---------------------------------------------------------------------------

type BoundStatusIconProps<TStatus extends string> = {
  status: TStatus;
  height?: number;
  width?: number;
};

type BoundStatusIconWithTextProps<TStatus extends string> = {
  status: TStatus;
  text?: string;
  dataTestAttribute?: string;
};

type BoundStatusIconWithTextLabelProps<TStatus extends string> = {
  status: TStatus;
  text?: string;
};

/**
 * Binds a registry to produce a namespace of components, hooks, and utilities.
 *
 * @example
 * ```ts
 * export const PLRStatus = createStatusComponents(PIPELINE_RUN_STATUS_REGISTRY);
 * <PLRStatus.StatusIconWithText status={status} />
 * ```
 */
export function createStatusComponents<TStatus extends string, TResource, TContext>(
  registry: StatusRegistry<TStatus, TResource, TContext>,
) {
  const StatusIcon: React.FC<BoundStatusIconProps<TStatus>> = ({ status, ...props }) => (
    <RegistryStatusIcon registry={registry} status={status} {...props} />
  );
  StatusIcon.displayName = 'StatusIcon';

  const StatusIconWithText: React.FC<BoundStatusIconWithTextProps<TStatus>> = (props) => (
    <RegistryStatusIconWithText registry={registry} {...props} />
  );
  StatusIconWithText.displayName = 'StatusIconWithText';

  const StatusIconWithTextLabel: React.FC<BoundStatusIconWithTextLabelProps<TStatus>> = (props) => (
    <RegistryStatusIconWithTextLabel registry={registry} {...props} />
  );
  StatusIconWithTextLabel.displayName = 'StatusIconWithTextLabel';

  return {
    StatusIcon,
    StatusIconWithText,
    StatusIconWithTextLabel,
    useStatusDisplay: (resource: TResource | null | undefined) =>
      useStatusDisplay(registry, resource),
    filterOptions: buildStatusFilterOptions(registry),
    statusFilterFn: (item: TResource, selectedValues: string[]): boolean =>
      registry.createFilterFn(selectedValues as TStatus[])(item),
    registry,
  };
}
