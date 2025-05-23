import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { AdminHeader } from './AdminPanel';

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ username: '', email: '' });
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [updating, setUpdating] = useState<{ avatar?: boolean; username?: boolean; email?: boolean; password?: boolean }>({});
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (res.ok) setProfile({ username: data.username, email: data.email, avatar: data.avatar });
      } catch {}
    };
    fetchProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setProfile({ username: data.username, email: data.email, avatar: data.avatar });
    } catch {}
  };

  const handleUpdateAvatar = async () => {
    setUpdating(u => ({ ...u, avatar: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ avatar: profile.avatar })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
        setSnackbar({ open: true, message: data.message || 'Update failed.', severity: 'error' });
      } else {
        setMsg('Avatar updated!');
        setSnackbar({ open: true, message: 'Avatar updated!', severity: 'success' });
        await refreshProfile();
        setTimeout(() => {
          navigate('/admin?section=tickets');
          window.location.reload();
        }, 800);
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, avatar: false }));
  };

  const handleUpdateUsername = async () => {
    setUpdating(u => ({ ...u, username: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: profile.username })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
        setSnackbar({ open: true, message: data.message || 'Update failed.', severity: 'error' });
      } else {
        setMsg('Username updated!');
        setSnackbar({ open: true, message: 'Username updated!', severity: 'success' });
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, username: false }));
  };

  const handleUpdateEmail = async () => {
    setUpdating(u => ({ ...u, email: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: profile.email })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
        setSnackbar({ open: true, message: data.message || 'Update failed.', severity: 'error' });
      } else {
        setMsg('Email updated!');
        setSnackbar({ open: true, message: 'Email updated!', severity: 'success' });
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, email: false }));
  };

  const handleUpdatePassword = async () => {
    setUpdating(u => ({ ...u, password: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ password, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
        setSnackbar({ open: true, message: data.message || 'Update failed.', severity: 'error' });
      } else {
        setMsg('Password updated!');
        setSnackbar({ open: true, message: 'Password updated!', severity: 'success' });
        setPassword(''); setNewPassword('');
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, password: false }));
  };

  return (
    <>
      <AdminHeader activeSection={'' as any} onSectionChange={() => {}} />
      <Box maxWidth={500} mx="auto" mt={6}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }} variant="outlined">Back</Button>
        <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" color="primary" fontWeight={700} mb={2} align="center">
            My Profile
          </Typography>
          {msg && <Alert severity="success" sx={{ mb: 2 }}>{msg}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form>
            <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
              <Avatar src={profile.avatar} sx={{ width: 72, height: 72, mb: 1, bgcolor: '#1976d2' }}>
                {(!profile.avatar) ? profile.username?.[0]?.toUpperCase() : ''}
              </Avatar>
              <Box display="flex" alignItems="center" gap={1} width="100%">
                <TextField
                  label="Avatar URL"
                  value={profile.avatar || ''}
                  onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))}
                  fullWidth
                  margin="normal"
                  placeholder="https://..."
                />
                <Button onClick={handleUpdateAvatar} variant="contained" color="primary" disabled={updating.avatar} sx={{ minWidth: 90, height: 40 }}>
                  {updating.avatar ? 'Updating...' : 'Update'}
                </Button>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1} width="100%">
              <TextField
                label="Username"
                value={profile.username}
                onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
                fullWidth
                margin="normal"
                required
              />
              <Button onClick={handleUpdateUsername} variant="contained" color="primary" disabled={updating.username} sx={{ minWidth: 90, height: 40 }}>
                {updating.username ? 'Updating...' : 'Update'}
              </Button>
            </Box>
            <Box display="flex" alignItems="center" gap={1} width="100%">
              <TextField
                label="Email"
                value={profile.email}
                onChange={e => setProfile(p => ({ ...p, email: e.target.value }))}
                fullWidth
                margin="normal"
                required
                type="email"
              />
              <Button onClick={handleUpdateEmail} variant="contained" color="primary" disabled={updating.email} sx={{ minWidth: 90, height: 40 }}>
                {updating.email ? 'Updating...' : 'Update'}
              </Button>
            </Box>
            <Box display="flex" alignItems="center" gap={1} width="100%">
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
              <Button onClick={handleUpdatePassword} variant="contained" color="primary" disabled={updating.password} sx={{ minWidth: 90, height: 40 }}>
                {updating.password ? 'Updating...' : 'Update'}
              </Button>
            </Box>
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
    </>
  );
};

export default Profile; 