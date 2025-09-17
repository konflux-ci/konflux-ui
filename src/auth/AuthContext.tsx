import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { AuthContextType } from './type';
import { setUserDataToLocalStorage } from './utils';

const redirectToLogin = () => {
  window.location.replace(`/oauth2/sign_in?rd=${window.location.pathname}`);
};

export const AuthContext = React.createContext<AuthContextType>({
  user: { email: null, preferredUsername: null },
  isAuthenticated: false,
});

export const AuthProvider: React.FC<React.PropsWithChildren> = React.memo(({ children }) => {
  const [user, setUser] = React.useState<AuthContextType['user']>({
    email: null,
    preferredUsername: null,
  });
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await fetch('/oauth2/userinfo');
        if (userData?.status === 401) {
          redirectToLogin();
        } else {
          const data = (await userData.json()) as AuthContextType['user'];
          setUser(data);
          setUserDataToLocalStorage({
            email: data.email,
            preferredUsername: data.preferredUsername,
          });
          setIsAuthenticated(true);
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.log('Error while Authenticating the user', err);
      }
    };
    void checkAuthStatus();
  }, []);

  const signOut = async () => {
    await fetch('/oauth2/sign_out');
    redirectToLogin();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        signOut,
      }}
    >
      {isAuthenticated ? (
        children
      ) : (
        <Bullseye>
          <Spinner />
        </Bullseye>
      )}
    </AuthContext.Provider>
  );
});
