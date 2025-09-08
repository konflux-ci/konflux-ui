import React from 'react';
import { ThemeContext, ThemeContextValue } from './ThemeContext';

export const useTheme = (): ThemeContextValue => React.useContext(ThemeContext);
