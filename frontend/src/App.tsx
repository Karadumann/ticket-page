import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import { getTheme } from './theme';
import Register from './pages/Register';
import Login from './pages/Login';
import Tickets from './pages/Tickets';
import AdminPanel from './pages/AdminPanel';
import TicketDetail from './pages/TicketDetail';
import Profile from './pages/Profile';
import { jwtDecode } from 'jwt-decode';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Dashboard from './pages/Dashboard';

function AppContent() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" width="99vw" bgcolor="background.default" position="relative">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
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
          <AppContent />
        </Router>
      </ThemeProvider>
    </LocalizationProvider>
  );
}

export default App;
