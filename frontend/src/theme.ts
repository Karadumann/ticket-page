import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff9100',
    },
    secondary: {
      main: '#23232b',
    },
    background: {
      default: '#18181c',
      paper: '#23232b',
    },
    text: {
      primary: '#fff',
      secondary: '#ff9100',
    },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: 'Segoe UI, Arial, sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
  },
});

export default theme; 