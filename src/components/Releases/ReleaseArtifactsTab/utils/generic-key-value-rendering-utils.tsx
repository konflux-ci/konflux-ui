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

function renderValue(value: unknown): React.ReactNode {
  if (value === null || value === undefined) {
    return <span>—</span>;
  }

  if (Array.isArray(value)) {
    if (value.every((v) => isObject(v) && v !== null && !Array.isArray(v))) {
      // Array of objects
      return (
        <ul style={{ margin: 0 }}>
          {value.map((obj, idx) => (
            <li key={idx} style={{ marginBottom: 'var(--pf-v5-global--spacer--sm)' }}>
              {Object.entries(obj as Record<string, unknown>).map(([k, v]) => (
                <div key={k}>
                  <strong>{humanizeKey(k)}:</strong> {renderFinalValue(v)}
                </div>
              ))}
            </li>
          ))}
        </ul>
      );
    }

    // Array of simple values
    return (
      <ul style={{ margin: 0 }}>
        {value.map((v, i) => (
          <li key={i}>{renderFinalValue(v)}</li>
        ))}
      </ul>
    );
  }

  if (typeof value === 'object') {
    return (
      <div>
        {Object.entries(value).map(([k, v]) => (
          <div key={k} style={{ marginBottom: 'var(--pf-v5-global--spacer--sm)' }}>
            <strong>{humanizeKey(k)}:</strong> {renderFinalValue(v)}
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
