import { UserDataType } from './type';
import { getLocalStorageData, setLocalStorageData } from '~/utils/local-storage';

const USER_DATA_KEY = '__user_session__';

export const getUserDataFromLocalStorage = (): UserDataType => {
  try {
    return JSON.parse(getLocalStorageData(USER_DATA_KEY));
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`Error while parsing user data from local storage`, e);
    return { email: null, preferredUsername: null };
  }
};

export const setUserDataToLocalStorage = (data: UserDataType) => {
  return setLocalStorageData(USER_DATA_KEY, JSON.stringify(data));
};
