import type { FC } from 'react';

export type AIChatPageContextRegistryEntry = {
  id: string;
  routePattern: string;
  Source: FC;
};

/**
 * Catalog of route patterns that publish a page snapshot for Konflux AI.
 * Add a page by appending one entry. Page views stay unchanged.
 */
export const aiChatPageContextRegistry: AIChatPageContextRegistryEntry[] = [];

export const getAIChatPageContextEntry = (
  routePattern: string,
): AIChatPageContextRegistryEntry | undefined =>
  aiChatPageContextRegistry.find((entry) => entry.routePattern === routePattern);
