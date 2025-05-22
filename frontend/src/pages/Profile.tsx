import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar } from '@mui/material';

interface UserProfile {
  username: string;
  email: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ username: '', email: '' });
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (res.ok) setProfile({ username: data.username, email: data.email });
      } catch {}
    };
    fetchProfile();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: profile.username, email: profile.email, password, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
        setSnackbar({ open: true, message: data.message || 'Update failed.', severity: 'error' });
      } else {
        setMsg('Profile updated!');
        setSnackbar({ open: true, message: 'Profile updated!', severity: 'success' });
        setPassword(''); setNewPassword('');
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
  };

  return (
    <Box maxWidth={500} mx="auto" mt={6}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h5" color="primary" fontWeight={700} mb={2} align="center">
          My Profile
        </Typography>
        {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleUpdate}>
          <TextField
            label="Username"
            value={profile.username}
            onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            value={profile.email}
            onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
            fullWidth
            margin="normal"
            required
            type="email"
          />
          <TextField
            label="Current Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            type="password"
            required
          />
          <TextField
            label="New Password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            fullWidth
            margin="normal"
            type="password"
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            Update Profile
          </Button>
        </form>
      </Paper>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        ContentProps={{
          style: { backgroundColor: snackbar.severity === 'success' ? '#43a047' : '#d32f2f', color: '#fff', fontWeight: 600, fontSize: 16 }
        }}
      />
    </Box>
  );
};

export default Profile; 