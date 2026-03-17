import { PipelineRunLabel } from '../consts/pipelinerun';
import { PipelineRunKind } from '../types';

/**
 * In-memory filter aligned with `commitSearchFilter` in `tekton-results.ts` for cluster and
 * KubeArchive pipeline run lists (Tekton Results uses the CEL `commitSearchFilter` instead).
 */
export const pipelineRunMatchesCommitSearch = (
  plr: PipelineRunKind,
  searchTerm: string,
): boolean => {
  const term = searchTerm.trim().toLowerCase();
  if (!term) return true;

  const labels = plr.metadata?.labels ?? {};
  const annotations = plr.metadata?.annotations ?? {};
  const prSubterm = term.replace('#', '');

  const fieldContainsTerm = (val: unknown) =>
    typeof val === 'string' && val.toLowerCase().includes(term);

  return (
    fieldContainsTerm(labels[PipelineRunLabel.COMMIT_LABEL]) ||
    fieldContainsTerm(labels[PipelineRunLabel.TEST_SERVICE_COMMIT]) ||
    fieldContainsTerm(annotations[PipelineRunLabel.COMMIT_ANNOTATION]) ||
    fieldContainsTerm(annotations[PipelineRunLabel.COMMIT_SHA_TITLE_ANNOTATION]) ||
    fieldContainsTerm(labels[PipelineRunLabel.COMPONENT]) ||
    (typeof labels[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL] === 'string' &&
      labels[PipelineRunLabel.PULL_REQUEST_NUMBER_LABEL].toLowerCase().includes(prSubterm))
  );
};
