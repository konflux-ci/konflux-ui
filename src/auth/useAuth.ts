import * as React from 'react';
import { AuthContext } from './AuthContext';
import { AuthContextType } from './type';

export const useAuth = (): AuthContextType => React.useContext(AuthContext);
