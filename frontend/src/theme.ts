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
      default: 'linear-gradient(135deg, #18181c 0%, #ff9100 100%)',
      paper: 'rgba(32,32,40,0.98)',
    },
    text: {
      primary: '#fff',
      secondary: '#ff9100',
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

export default theme; 