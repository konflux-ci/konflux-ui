import * as React from 'react';
import { UNSAFE_DataRouterContext as DataRouterContext, useMatches } from 'react-router-dom';
import { useAIChatPageContextPublisher } from '~/components/AIChat/pageContext/AIChatPageContext';
import { getAIChatPageContextEntry } from '~/components/AIChat/pageContext/registry';
import { getRoutePatternFromMatches } from '~/routes/with-route-patterns';

/**
 * Mounts the registry source for the current route and clears the snapshot otherwise.
 * `useMatches` is only valid inside a data router. App shell unit tests render through
 * `BrowserRouter`, so skip resolution there.
 */
const AIChatPageContextRouteSource: React.FC = () => {
  const matches = useMatches();
  const routePattern = getRoutePatternFromMatches(matches);
  const publishPageContext = useAIChatPageContextPublisher();
  const entry = getAIChatPageContextEntry(routePattern);

  React.useEffect(() => {
    if (!entry) {
      publishPageContext(null);
    }

    return () => {
      publishPageContext(null);
    };
  }, [entry, publishPageContext]);

  if (!entry) {
    return null;
  }

  const { Source } = entry;
  return <Source />;
};

export const AIChatPageContextResolver: React.FC = () => {
  const dataRouterContext = React.useContext(DataRouterContext);
  if (!dataRouterContext) {
    return null;
  }

  return <AIChatPageContextRouteSource />;
};
