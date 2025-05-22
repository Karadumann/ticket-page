import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Button, Stack, Paper, IconButton } from '@mui/material';
import { getTheme } from './theme';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Register from './pages/Register';
import Login from './pages/Login';
import Tickets from './pages/Tickets';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanel from './pages/AdminPanel';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import { jwtDecode } from 'jwt-decode';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

function AppContent({ toggleTheme, mode }: { toggleTheme: () => void; mode: 'light' | 'dark' }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setIsAdmin(decoded.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" width="99vw" bgcolor="background.default" position="relative">
      <Routes>
        <Route path="/" element={
          <Box width="100%" display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
            <Paper elevation={6} sx={{ p: 6, borderRadius: 6, bgcolor: 'background.paper', minWidth: 350 }}>
              <Stack spacing={3} direction="column" alignItems="center">
                {!isLoggedIn && (
                  <>
                    <Button variant="contained" color="primary" size="large" sx={{ fontSize: 22, py: 2, borderRadius: 3 }} fullWidth href="/login">Login</Button>
                    <Button variant="outlined" color="primary" size="large" sx={{ fontSize: 22, py: 2, borderRadius: 3 }} fullWidth href="/register">Register</Button>
                  </>
                )}
                {isLoggedIn && (
                  <>
                    <Button variant="contained" color="primary" size="large" sx={{ fontSize: 20, py: 2, borderRadius: 3 }} fullWidth href="/tickets">My Tickets</Button>
                    {isAdmin && (
                      <Button variant="contained" color="secondary" size="large" sx={{ fontSize: 20, py: 2, borderRadius: 3 }} fullWidth href="/admin">Admin Panel</Button>
                    )}
                    <Button onClick={handleLogout} sx={{ minWidth: 0, ml: 2, borderRadius: '50%', p: 1, alignSelf: 'center', bgcolor: 'var(--card)', color: 'var(--primary)', boxShadow: 2, '&:hover': { bgcolor: 'var(--primary)', color: 'var(--card)' } }}>
                      <LogoutIcon fontSize="large" />
                    </Button>
                  </>
                )}
              </Stack>
            </Paper>
          </Box>
        } />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id" element={<TicketDetail />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={getTheme('light')}>
        <CssBaseline />
        <Router>
          <AppContent toggleTheme={() => {}} mode="light" />
        </Router>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
