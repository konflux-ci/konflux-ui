import * as React from 'react';
import { AIChatRegisteredPageContext } from '~/components/AIChat/pageContext/types';

type AIChatPageContextValue = {
  pageContext: AIChatRegisteredPageContext | null;
  publishPageContext: (context: AIChatRegisteredPageContext | null) => void;
};

const AIChatPageContext = React.createContext<AIChatPageContextValue | undefined>(undefined);

const useAIChatPageContextValue = (): AIChatPageContextValue => {
  const value = React.useContext(AIChatPageContext);
  if (!value) {
    throw new Error('AI chat page context is only available inside AIChatPageContextProvider');
  }
  return value;
};

export const AIChatPageContextProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [pageContext, setPageContext] = React.useState<AIChatRegisteredPageContext | null>(null);
  const publishPageContext = React.useCallback((context: AIChatRegisteredPageContext | null) => {
    setPageContext(context);
  }, []);
  const value = React.useMemo(
    () => ({ pageContext, publishPageContext }),
    [pageContext, publishPageContext],
  );

  return <AIChatPageContext.Provider value={value}>{children}</AIChatPageContext.Provider>;
};

export const useAIChatPageContext = (): AIChatRegisteredPageContext | null =>
  useAIChatPageContextValue().pageContext;

export const useAIChatPageContextPublisher = (): AIChatPageContextValue['publishPageContext'] =>
  useAIChatPageContextValue().publishPageContext;
