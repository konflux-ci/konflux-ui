import * as React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NavExpandable, NavItem } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { useNamespace } from '~/shared/providers/Namespace';
import { SavedViewNavItems } from './SavedViewNavItems';
import { SavedViewsConfig } from './types';
import { useSavedViews } from './useSavedViews';

export type SavedViewNavSectionProps = {
  /** Label displayed in the sidebar */
  title: React.ReactNode;
  /** Saved views configuration for this section */
  config: SavedViewsConfig;
  /** Whether this route is currently active */
  isActive: boolean;
  /** Whether the nav item should be disabled (e.g. no namespace selected) */
  disabled?: boolean;
  /** The href to navigate to when the title is clicked */
  href?: string;
  /** Test ID for the nav section */
  'data-test'?: string;
};

/**
 * Sidebar nav section that conditionally renders as:
 * - `NavExpandable` with saved view sub-items when saved views exist
 * - Plain `NavItem` when no saved views exist
 *
 * Reusable for any page that supports saved views.
 */
export const SavedViewNavSection: React.FC<SavedViewNavSectionProps> = ({
  title,
  config,
  isActive,
  disabled,
  href,
  'data-test': dataTest,
}) => {
  const namespace = useNamespace();
  const { views } = useSavedViews(config, namespace);
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = React.useState(true);

  const hasSavedViews = namespace && views.length > 0;

  if (!hasSavedViews) {
    return (
      <NavItem
        className={css({ 'app-side-bar__nav-item--disabled': disabled })}
        isActive={isActive}
        data-test={dataTest}
      >
        <Link to={disabled ? undefined : href}>{title}</Link>
      </NavItem>
    );
  }

  return (
    <NavExpandable
      title={title}
      isActive={isActive}
      isExpanded={isExpanded}
      onExpand={(e) => {
        const target = e.target as HTMLElement;
        const isToggleArrow = target.closest('.pf-v6-c-nav__toggle-icon');
        if (isToggleArrow) {
          setIsExpanded((prev) => !prev);
        } else if (href && !disabled) {
          navigate(href);
        }
      }}
      className={css({ 'app-side-bar__nav-item--disabled': disabled })}
      data-test={dataTest}
    >
      <SavedViewNavItems config={config} />
    </NavExpandable>
  );
};
