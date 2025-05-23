import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [avatar, setAvatar] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, avatar })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Registration failed.');
      } else {
        setSuccess('Registration successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (err) {
      setError('Server error.');
    }
  };

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" width="100%">
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: '100%', maxWidth: 400 }}>
        <Typography variant="h4" color="primary" fontWeight={700} mb={2} align="center">
          Register
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          <TextField
            label="Avatar URL (optional)"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="https://..."
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 2 }}
          >
            Register
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default Register; 