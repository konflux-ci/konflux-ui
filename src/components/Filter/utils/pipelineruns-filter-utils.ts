import { PipelineRunKind } from '../../../types';

export const createFilterObj = (
  items: PipelineRunKind[],
  keyExtractor: (item: PipelineRunKind) => string | undefined,
  validKeys: string[],
  filterFn?: (item: PipelineRunKind) => boolean,
): { [key: string]: number } => {
  return items.reduce((acc, item) => {
    if (filterFn && !filterFn(item)) {
      return acc;
    }

    const key = keyExtractor(item);

    if (validKeys.includes(key)) {
      if (acc[key] !== undefined) {
        acc[key] = acc[key] + 1;
      } else {
        acc[key] = 1;
      }
    }

    return acc;
  }, {});
};
