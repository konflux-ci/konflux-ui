let params = {};

export const mockUseSearchParamBatch = () => {
  const getter = (value) => {
    return { [value]: params[value] };
  };
  const setter = (newValues: Record<string, string>) => {
    Object.keys(newValues).forEach((key) => {
      params[key] = newValues[key];
    });
  };
  const unset = () => {
    params = {};
  };
  return [getter, setter, unset];
};
