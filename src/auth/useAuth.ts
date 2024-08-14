import * as React from 'react';
import { AuthContext, AuthContextType } from './AuthContext';

export const useAuth = (): AuthContextType => React.useContext(AuthContext);
