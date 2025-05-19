import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box, Grid, Button, Stack, Paper, Typography } from '@mui/material';
import theme from './theme';
import Register from './pages/Register';
import Login from './pages/Login';
import Tickets from './pages/Tickets';
import LogoutIcon from '@mui/icons-material/Logout';

function AppContent() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('token'));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.reload();
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" width="100vw" bgcolor="background.default">
      <Routes>
        <Route path="/" element={
          <Box width="100%" display="flex" alignItems="center" justifyContent="center" minHeight="60vh">
            <Paper elevation={6} sx={{ p: 6, borderRadius: 6, bgcolor: 'background.paper', minWidth: 350 }}>
              <Stack spacing={3}>
                {!isLoggedIn && (
                  <>
                    <Button variant="contained" color="primary" size="large" sx={{ fontSize: 22, py: 2, borderRadius: 3 }} fullWidth href="/login">Login</Button>
                    <Button variant="outlined" color="primary" size="large" sx={{ fontSize: 22, py: 2, borderRadius: 3 }} fullWidth href="/register">Register</Button>
                  </>
                )}
                {isLoggedIn && (
                  <>
                    <Button variant="contained" color="primary" size="large" sx={{ fontSize: 20, py: 2, borderRadius: 3 }} fullWidth href="/tickets">My Tickets</Button>
                    <Button onClick={handleLogout} color="secondary" sx={{ minWidth: 0, ml: 2, borderRadius: '50%', p: 1, alignSelf: 'center' }}>
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
      </Routes>
    </Box>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
