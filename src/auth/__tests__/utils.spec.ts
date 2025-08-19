/* eslint-disable no-console */
import { getLocalStorageData, setLocalStorageData } from '~/utils/local-storage';
import { UserDataType } from '../type';
import {
  getUserDataFromLocalStorage,
  setUserDataToLocalStorage,
  getUserDataWithFallback,
} from '../utils';

jest.mock('~/utils/local-storage', () => ({
  getLocalStorageData: jest.fn(),
  setLocalStorageData: jest.fn(),
}));

const mockGetLocalStorageData = getLocalStorageData as jest.Mock;
const mockSetLocalStorageData = setLocalStorageData as jest.Mock;

describe('auth utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserDataFromLocalStorage', () => {
    const validUserData: UserDataType = {
      email: 'test@example.com',
      preferredUsername: 'testuser',
    };

    it('should return parsed user data when valid JSON is stored', () => {
      const jsonUserData = JSON.stringify(validUserData);
      mockGetLocalStorageData.mockReturnValue(jsonUserData);

      const result = getUserDataFromLocalStorage();

      expect(mockGetLocalStorageData).toHaveBeenCalledWith('__user_session__');
      expect(result).toEqual(validUserData);
    });

    it('should return null when localStorage returns null', () => {
      mockGetLocalStorageData.mockReturnValue(null);

      const result = getUserDataFromLocalStorage();

      expect(result).toBeNull();
    });

    it('should return null when localStorage returns empty string', () => {
      mockGetLocalStorageData.mockReturnValue('');

      const result = getUserDataFromLocalStorage();

      expect(result).toBeNull();
    });

    it('should return null when JSON.parse returns null', () => {
      mockGetLocalStorageData.mockReturnValue('null');

      const result = getUserDataFromLocalStorage();

      expect(result).toBeNull();
    });

    it('should return null when JSON.parse returns undefined', () => {
      mockGetLocalStorageData.mockReturnValue('undefined');

      const result = getUserDataFromLocalStorage();

      expect(result).toBeNull();
    });

    it('should handle invalid JSON gracefully and return null', () => {
      mockGetLocalStorageData.mockReturnValue('invalid-json{');

      const result = getUserDataFromLocalStorage();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error while parsing user data from local storage',
        expect.any(SyntaxError),
      );
    });

    it('should handle partial user data objects', () => {
      const partialUserData = { email: 'test@example.com' };
      mockGetLocalStorageData.mockReturnValue(JSON.stringify(partialUserData));

      const result = getUserDataFromLocalStorage();

      expect(result).toEqual(partialUserData);
    });

    it('should handle user data with null values', () => {
      const userDataWithNulls: UserDataType = { email: null, preferredUsername: 'user123' };
      mockGetLocalStorageData.mockReturnValue(JSON.stringify(userDataWithNulls));

      const result = getUserDataFromLocalStorage();

      expect(result).toEqual(userDataWithNulls);
    });

    it('should handle empty object', () => {
      const emptyObject = {};
      mockGetLocalStorageData.mockReturnValue(JSON.stringify(emptyObject));

      const result = getUserDataFromLocalStorage();

      expect(result).toEqual(emptyObject);
    });

    it('should handle when getLocalStorageData throws an error', () => {
      mockGetLocalStorageData.mockImplementation(() => {
        throw new Error('localStorage access denied');
      });

      const result = getUserDataFromLocalStorage();

      expect(result).toBeNull();
      expect(console.error).toHaveBeenCalledWith(
        'Error while parsing user data from local storage',
        expect.any(Error),
      );
    });
  });

  describe('setUserDataToLocalStorage', () => {
    it('should store user data as JSON string', () => {
      const userData: UserDataType = {
        email: 'test@example.com',
        preferredUsername: 'testuser',
      };

      setUserDataToLocalStorage(userData);

      expect(mockSetLocalStorageData).toHaveBeenCalledWith(
        '__user_session__',
        JSON.stringify(userData),
      );
    });

    it('should handle user data with null values', () => {
      const userData: UserDataType = { email: null, preferredUsername: 'user123' };

      setUserDataToLocalStorage(userData);

      expect(mockSetLocalStorageData).toHaveBeenCalledWith(
        '__user_session__',
        JSON.stringify(userData),
      );
    });

    it('should handle user data with all null values', () => {
      const userData: UserDataType = { email: null, preferredUsername: null };

      setUserDataToLocalStorage(userData);

      expect(mockSetLocalStorageData).toHaveBeenCalledWith(
        '__user_session__',
        JSON.stringify(userData),
      );
    });
  });

  describe('getUserDataWithFallback', () => {
    const validUserData: UserDataType = {
      email: 'test@example.com',
      preferredUsername: 'testuser',
    };

    it('should return localStorage data when available', async () => {
      mockGetLocalStorageData.mockReturnValue(JSON.stringify(validUserData));

      const result = await getUserDataWithFallback();

      expect(result).toEqual(validUserData);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fallback to API when localStorage is empty', async () => {
      mockGetLocalStorageData.mockReturnValue(null);
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue(validUserData),
      });

      const result = await getUserDataWithFallback();

      expect(result).toEqual(validUserData);
      expect(mockFetch).toHaveBeenCalledWith('/oauth2/userinfo');
      expect(mockSetLocalStorageData).toHaveBeenCalledWith(
        '__user_session__',
        JSON.stringify(validUserData),
      );
    });

    it('should fallback to API when localStorage has invalid data', async () => {
      mockGetLocalStorageData.mockReturnValue('invalid-json{');
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue(validUserData),
      });

      const result = await getUserDataWithFallback();

      expect(result).toEqual(validUserData);
      expect(mockFetch).toHaveBeenCalledWith('/oauth2/userinfo');
      expect(mockSetLocalStorageData).toHaveBeenCalledWith(
        '__user_session__',
        JSON.stringify(validUserData),
      );
    });

    it('should store API data in localStorage when fetched', async () => {
      const apiUserData: UserDataType = {
        email: 'test@example.com',
        preferredUsername: 'testuser',
      };

      mockGetLocalStorageData.mockReturnValue(null);
      const mockFetch = global.fetch as jest.Mock;
      mockFetch.mockResolvedValue({
        status: 200,
        json: jest.fn().mockResolvedValue(apiUserData),
      });

      const result = await getUserDataWithFallback();

      expect(result).toEqual(apiUserData);
      expect(mockFetch).toHaveBeenCalledWith('/oauth2/userinfo');
      expect(mockSetLocalStorageData).toHaveBeenCalledWith(
        '__user_session__',
        JSON.stringify(apiUserData),
      );
    });
  });
});
