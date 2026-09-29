export type AIChatRoutePageContext = {
  pathname: string;
  routePattern: string;
  params: Readonly<Record<string, string | undefined>>;
};

/**
 * Snapshot published by a registry source for the current route.
 * The first catalog source replaces this with a discriminated union.
 */
export type AIChatRegisteredPageContext = {
  page: string;
};

export type AIChatPageContextPayload = {
  route: AIChatRoutePageContext;
  page?: AIChatRegisteredPageContext;
};

export const buildPageContextPayload = (
  route: AIChatRoutePageContext,
  page: AIChatRegisteredPageContext | null,
): AIChatPageContextPayload => {
  const payload: AIChatPageContextPayload = { route };
  if (page !== null) {
    payload.page = page;
  }
  return payload;
};
