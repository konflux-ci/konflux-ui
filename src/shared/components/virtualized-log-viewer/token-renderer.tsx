import React from 'react';
import Prism from 'prismjs';
import { flattenTokenText, isMatchCurrent } from './log-viewer-utils';
import type { MatchRange } from './types';

const EMAIL_REGEX = /[^\s@?]+@[^\s@?/:]+\.[^\s@?/:]+$/;
/** Absolute http(s)/ftp URLs; must not include surrounding quotes or other token junk. */
const ABSOLUTE_URL_REGEX = /\b(?:https?|ftp):\/\/[^\s"'<>\]]+/i;
const MAILTO_REGEX = /\bmailto:([^\s"'<>\]?]+)/i;

/**
 * Returns a safe absolute href extracted from token text, or empty string.
 * Extracts the URL/email from surrounding characters (quotes, key=value, etc.)
 * so the browser never resolves a non-absolute href against the app origin.
 * Mailto URIs are sanitized to strip query parameters.
 */
export function getTokenHref(text: string): string {
  const urlMatch = text.match(ABSOLUTE_URL_REGEX);
  if (urlMatch) return urlMatch[0];

  const mailtoMatch = text.match(MAILTO_REGEX);
  if (mailtoMatch) return `mailto:${mailtoMatch[1]}`;

  const emailMatch = !text.includes('://') ? text.match(EMAIL_REGEX) : null;
  if (emailMatch) return `mailto:${emailMatch[0]}`;
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
  const isMailto = href.startsWith('mailto:');
  const linkProps = isLink
    ? {
        href,
        ...(isMailto
          ? { 'aria-label': tokenText }
          : {
              target: '_blank' as const,
              rel: 'noopener noreferrer',
              'aria-label': `${tokenText} (opens in new tab)`,
            }),
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
