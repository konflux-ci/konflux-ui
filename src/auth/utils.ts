import { getLocalStorageData, setLocalStorageData } from '~/utils/local-storage';
import { UserDataType } from './type';

const USER_DATA_KEY = '__user_session__';

export const getUserDataFromLocalStorage = (): UserDataType | null => {
  try {
    const rawData = getLocalStorageData(USER_DATA_KEY);
    if (!rawData) return null;

    const parsedUserData = JSON.parse(rawData);
    if (!parsedUserData) return null;

    return parsedUserData;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error while parsing user data from local storage`, e);
    return null;
  }
};

export const setUserDataToLocalStorage = (data: UserDataType) => {
  return setLocalStorageData(USER_DATA_KEY, JSON.stringify(data));
};

const fetchUserDataFromAPI = async (): Promise<UserDataType> => {
  const response = await fetch('/oauth2/userinfo');
  if (response.status === 401) {
    throw new Error('User not authenticated');
  }

  const userData = (await response.json()) as UserDataType;
  setUserDataToLocalStorage(userData);

  return userData;
};

export const getUserDataWithFallback = async (): Promise<UserDataType> => {
  const localData = getUserDataFromLocalStorage();
  if (localData) {
    return localData;
  }

  return fetchUserDataFromAPI();
};
