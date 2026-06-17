import * as React from 'react';
import { CONTEXT_TARGET_CLASS } from '~/consts/ai-chat-context';
import { useIsOnFeatureFlag } from '~/feature-flags/hooks';
import { buildContextTargetProps } from '~/utils/ai-chat-context';

type ChatContextTargetProps = {
  id: string;
  label: string;
  description?: string;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
};

export const ChatContextTarget: React.FC<ChatContextTargetProps> = ({
  id,
  label,
  description,
  as: Component = 'div',
  className,
  children,
}) => {
  const isEnabled = useIsOnFeatureFlag('ai-chat');

  if (!isEnabled) {
    return <>{children}</>;
  }

  return (
    <Component
      className={[CONTEXT_TARGET_CLASS, className].filter(Boolean).join(' ')}
      data-test={`ai-chat-context-target-${id}`}
      {...buildContextTargetProps({ id, label, description })}
    >
      {children}
    </Component>
  );
};
