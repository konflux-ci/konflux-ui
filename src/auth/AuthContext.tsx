import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';

export type AuthContextType = {
  user: { email: string | null };
  isAuthenticated: boolean;
  signOut?: () => void;
};

const redirectToLogin = () => {
  window.location.replace(`/oauth2/sign_in?rd=${window.location.pathname}`);
};

export const AuthContext = React.createContext<AuthContextType>({
  user: { email: null },
  isAuthenticated: false,
});

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = React.useState<AuthContextType['user']>({ email: null });
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);

  React.useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userData = await fetch('/oauth2/userinfo');
        if (userData?.status === 401) {
          redirectToLogin();
        } else {
          setUser((await userData.json()) as AuthContextType['user']);
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
};
