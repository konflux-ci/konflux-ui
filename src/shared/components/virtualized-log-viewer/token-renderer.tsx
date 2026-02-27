import React from 'react';
import { flattenTokenText, isMatchCurrent } from './log-viewer-utils';
import Prism from './prism-log-language';
import type { MatchRange } from './types';

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
        className={`pf-v5-c-log-viewer__string pf-m-match ${isCurrent ? 'pf-m-current' : ''}`}
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
 * Recursively renders Prism tokens with syntax highlighting and search matches
 * Handles nested token structures and accumulates offset for correct match positioning
 */
export function renderTokenRecursive(
  token: string | Prism.Token,
  tokenStart: number,
  lineMatches: MatchRange[],
  currentMatch: MatchRange | null,
  key: number,
  depth = 0,
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

  if (Array.isArray(token.content)) {
    let childStart = tokenStart;
    return (
      <span key={key} className={className}>
        {token.content.map((t: string | Prism.Token, i: number) => {
          const rendered = renderTokenRecursive(
            t,
            childStart,
            lineMatches,
            currentMatch,
            i,
            depth + 1,
          );
          childStart += flattenTokenText(t).length;
          return rendered;
        })}
      </span>
    );
  }

  // Handle token.content as string
  if (typeof token.content === 'string') {
    return (
      <span key={key} className={className}>
        {renderTokenString(token.content, tokenStart, lineMatches, currentMatch)}
      </span>
    );
  }

  // Recursive case: token.content is another Token
  return (
    <span key={key} className={className}>
      {renderTokenRecursive(token.content, tokenStart, lineMatches, currentMatch, 0, depth + 1)}
    </span>
  );
}
