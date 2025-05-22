import { createTheme } from '@mui/material/styles';

export const getTheme = (mode: 'light' | 'dark') => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#3fa7ff' : '#3fa7ff',
    },
    secondary: {
      main: mode === 'light' ? '#e3f2fd' : '#f5f7fa',
    },
    background: {
      default: mode === 'light' ? '#f7fafc' : '#f0f4f8',
      paper: mode === 'light' ? '#fff' : '#f7fafc',
    },
    text: {
      primary: mode === 'light' ? '#23232b' : '#23232b',
      secondary: mode === 'light' ? '#3fa7ff' : '#3fa7ff',
    },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily: 'Inter, Segoe UI, Arial, sans-serif',
    h1: { fontWeight: 900 },
    h2: { fontWeight: 800 },
    h3: { fontWeight: 800 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
}); 