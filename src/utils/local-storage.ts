export const getLocalStorageData = (key: string) => {
  return localStorage.getItem(key);
};

export const setLocalStorageData = (key: string, data: string) => {
  localStorage.setItem(key, data);
};
