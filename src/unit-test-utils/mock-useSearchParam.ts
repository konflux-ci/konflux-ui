let params = {};

export const mockUseSearchParamBatch = () => {
  const getter = () => {
    return params;
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
