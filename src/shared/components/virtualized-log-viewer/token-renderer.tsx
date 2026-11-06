import React from 'react';
import Prism from 'prismjs';
import { flattenTokenText, isMatchCurrent } from './log-viewer-utils';
import type { MatchRange } from './types';

const EMAIL_REGEX = /^[^\s@?]+@[^\s@?/:]+\.[^\s@?/:]+$/;
const SAFE_SCHEMES_REGEX = /(https?|ftp|mailto):/i;

/**
 * Returns the href for a URL/email token, or empty string for unsafe schemes.
 * Mailto URIs are sanitized to strip query parameters.
 */
export function getTokenHref(text: string): string {
  if (SAFE_SCHEMES_REGEX.test(text)) {
    if (/^mailto:/i.test(text)) {
      return `mailto:${text.slice(7).split('?')[0]}`;
    }
    return text;
  }
  if (!text.includes('://') && EMAIL_REGEX.test(text)) return `mailto:${text}`;
  return '';
}

/**
 * Renders a string token with search highlights
 * Splits the token into highlighted and non-highlighted segments
 */
export function renderTokenString(
  tokenStr: string,
  tokenStart: number,
  lineMatches: MatchRange[],
  currentMatch: MatchRange | null,
): React.ReactNode[] {
  const pieces: React.ReactNode[] = [];
  let idx = 0;

  for (const match of lineMatches) {
    if (match.end <= tokenStart + idx) continue;
    if (match.start >= tokenStart + tokenStr.length) break;

    const startInToken = Math.max(match.start - tokenStart, 0);
    const endInToken = Math.min(match.end - tokenStart, tokenStr.length);

    if (startInToken > idx)
      pieces.push(<span key={`text-${idx}`}>{tokenStr.slice(idx, startInToken)}</span>);

    const isCurrent = isMatchCurrent(
      tokenStart + startInToken,
      tokenStart + endInToken,
      currentMatch,
    );

    pieces.push(
      <mark
        key={`mark-${startInToken}`}
        className={`pf-v6-c-log-viewer__string pf-m-match ${isCurrent ? 'pf-m-current' : ''}`}
      >
        {tokenStr.slice(startInToken, endInToken)}
      </mark>,
    );

    idx = endInToken;
  }

  if (idx < tokenStr.length) pieces.push(<span key={`text-${idx}`}>{tokenStr.slice(idx)}</span>);

  return pieces;
}

/**
 * Recursively renders Prism tokens with syntax highlighting and search matches.
 * Handles nested token structures and accumulates offset for correct match positioning.
 * When insideAnchor is true, tokens are always rendered as spans to avoid nested anchors.
 */
export function renderTokenRecursive(
  token: string | Prism.Token,
  tokenStart: number,
  lineMatches: MatchRange[],
  currentMatch: MatchRange | null,
  key: number,
  depth = 0,
  insideAnchor = false,
): React.ReactNode {
  if (depth > 50) return <span key={key}>...</span>;

  if (typeof token === 'string')
    return renderTokenString(token, tokenStart, lineMatches, currentMatch);

  const tokenType = Array.isArray(token.type) ? token.type.join(' ') : token.type;
  const tokenAlias = token.alias
    ? Array.isArray(token.alias)
      ? token.alias.join(' ')
      : token.alias
    : '';
  const className = `token ${tokenType}${tokenAlias ? ` ${tokenAlias}` : ''}`;

  const tokenText = flattenTokenText(token);
  const href = insideAnchor ? '' : getTokenHref(tokenText);
  const isLink = href !== '';
  const Tag = isLink ? 'a' : 'span';
  const linkProps = isLink
    ? {
        href,
        target: '_blank' as const,
        rel: 'noopener noreferrer',
        'aria-label': `${tokenText} (opens in new tab)`,
      }
    : {};
  const childInsideAnchor = insideAnchor || isLink;

  if (Array.isArray(token.content)) {
    let childStart = tokenStart;
    return (
      <Tag key={key} className={className} {...linkProps}>
        {token.content.map((t: string | Prism.Token, i: number) => {
          const rendered = renderTokenRecursive(
            t,
            childStart,
            lineMatches,
            currentMatch,
            i,
            depth + 1,
            childInsideAnchor,
          );
          childStart += flattenTokenText(t).length;
          return rendered;
        })}
      </Tag>
    );
  }

  // Handle token.content as string
  if (typeof token.content === 'string') {
    return (
      <Tag key={key} className={className} {...linkProps}>
        {renderTokenString(token.content, tokenStart, lineMatches, currentMatch)}
      </Tag>
    );
  }

  // Recursive case: token.content is another Token
  return (
    <Tag key={key} className={className} {...linkProps}>
      {renderTokenRecursive(
        token.content,
        tokenStart,
        lineMatches,
        currentMatch,
        0,
        depth + 1,
        childInsideAnchor,
      )}
    </Tag>
  );
}
