import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { isObject } from 'lodash-es';
import ExternalLink from '../../../../shared/components/links/ExternalLink';
import { getImageLink, isUrl } from './url';

/**
 * converts a key (e.g. `build_id`, `commitHash`) into a more readable label
 * by adding spaces and capitalizing only the first word.
 *
 * Examples:
 * - "build_id"     -> "Build id"
 * - "commitHash"   -> "Commit hash"
 * - "last_updated" -> "Last updated"
 */
function humanizeKey(key: string): string {
  const spaced = key
    .replace(/_{2,}/g, '_') // Replace multiple underscores with a single underscore
    .replace(/_/g, ' ') // Replace remaining underscores with spaces
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2'); // add space between camelCase words

  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLocaleLowerCase(); // Capitalize only the first letter
}

function renderFinalValue(value: unknown): React.ReactNode {
  const str = String(value);
  if (isUrl(str)) {
    return <ExternalLink href={str} text={str} dataTestID="external-link" />;
  }
  if (str.includes('quay.io')) {
    return <ExternalLink href={getImageLink(str)} text={str} dataTestID="external-link" />;
  }

  if (isObject(value)) {
    return JSON.stringify(value, null, 2);
  }
  return str;
}

function renderValue(value: unknown, level: number = 0): React.ReactNode {
  if (value === null || value === undefined) {
    return <span>—</span>;
  }

  const indent = level > 0 ? { marginLeft: `${level * 3}px` } : {};

  if (Array.isArray(value)) {
    return value.length === 0 ? (
      <span>—</span>
    ) : (
      <div style={indent}>
        {value.map((item, idx) => (
          <div key={idx}>{renderValue(item, level + 1)}</div>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return entries.length === 0 ? (
      <span>—</span>
    ) : (
      <div style={indent}>
        {entries.map(([k, v]) => (
          <div key={k}>
            <strong>{humanizeKey(k)}:</strong> {renderValue(v, level + 1)}
          </div>
        ))}
      </div>
    );
  }

  return renderFinalValue(value);
}

export function renderKeyValueList(data: Record<string, unknown>) {
  return (
    <DescriptionList columnModifier={{ default: '2Col', md: '3Col' }}>
      {Object.entries(data).map(([key, value]) => (
        <DescriptionListGroup key={key}>
          <DescriptionListTerm>{humanizeKey(key)}</DescriptionListTerm>
          <DescriptionListDescription>{renderValue(value)}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
}
