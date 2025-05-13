export type UserDataType = { email: string | null; preferredUsername: string | null };

export type AuthContextType = {
  user: UserDataType;
  isAuthenticated: boolean;
  signOut?: () => void;
};
