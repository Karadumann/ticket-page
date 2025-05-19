import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Container, Box, Grid } from '@mui/material';
import theme from './theme';
import Register from './pages/Register';
import Login from './pages/Login';
import Tickets from './pages/Tickets';
import Header from './components/Header';

function AppContent() {
  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" width="100vw">
      <Routes>
        <Route path="/" element={<Box width="100%" display="flex" alignItems="center" justifyContent="center" minHeight="60vh"><h2 style={{margin:0}}>Welcome! Please log in to the support system.</h2></Box>} />
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
        <Header />
        <AppContent />
      </Router>
    </ThemeProvider>
  );
}

export default App;
