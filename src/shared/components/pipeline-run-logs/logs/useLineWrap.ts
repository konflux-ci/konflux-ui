import { useLocalStorage } from '~/shared/hooks/useLocalStorage';

export const LOG_WRAP_LINES_STORAGE_KEY = 'konflux-logs-wrap-lines-preference';

type UseLineWrapResult = [boolean, (wrapLines: boolean | ((prev: boolean) => boolean)) => void];

export const useLineWrap = (): UseLineWrapResult => {
  const [wrapLines, setWrapLines] = useLocalStorage<boolean>(LOG_WRAP_LINES_STORAGE_KEY, true);

  return [wrapLines ?? true, setWrapLines];
};
