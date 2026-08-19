import { useLocalStorage } from '~/shared/hooks/useLocalStorage';

const LOG_WRAP_STORAGE_KEY = 'konflux-logs-wrap-preference';

type UseLogViewerWrapResult = [boolean, (wrapLines: boolean) => void];

/**
 * Persists the log viewer "Wrap lines" preference in localStorage.
 * Defaults to true so behavior matches the previous always-on wrap.
 */
export const useLogViewerWrap = (): UseLogViewerWrapResult => {
  const [wrapLines, setWrapLines] = useLocalStorage<boolean>(LOG_WRAP_STORAGE_KEY, true);
  return [wrapLines ?? true, setWrapLines];
};
