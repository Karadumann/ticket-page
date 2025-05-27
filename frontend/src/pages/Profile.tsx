import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, Checkbox, FormControlLabel, FormGroup, Divider, Tooltip, IconButton } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header from '../components/Header';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton as MuiIconButton } from '@mui/material';

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
  notificationPreferences?: {
    email: boolean;
    discord: boolean;
    telegram: boolean;
  };
  discordId?: string;
  discordUsername?: string;
  telegramId?: string;
  telegramUsername?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ username: '', email: '', notificationPreferences: { email: true, discord: false, telegram: false }, discordId: '', telegramId: '' });
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [updating, setUpdating] = useState<{ avatar?: boolean; username?: boolean; email?: boolean; password?: boolean; notification?: boolean; discord?: boolean; telegram?: boolean }>({});
  const [userId, setUserId] = useState<string>('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProfile({ username: data.username, email: data.email, avatar: data.avatar, notificationPreferences: data.notificationPreferences, discordId: data.discordId, discordUsername: data.discordUsername, telegramId: data.telegramId, telegramUsername: data.telegramUsername });
          setUserId(data._id || '');
        }
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
      if (res.ok) setProfile({ username: data.username, email: data.email, avatar: data.avatar, notificationPreferences: data.notificationPreferences, discordId: data.discordId, discordUsername: data.discordUsername, telegramId: data.telegramId, telegramUsername: data.telegramUsername });
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

  const handleUpdateNotificationPrefs = async () => {
    setUpdating(u => ({ ...u, notification: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ notificationPreferences: profile.notificationPreferences })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Update failed.');
        setSnackbar({ open: true, message: data.message || 'Update failed.', severity: 'error' });
      } else {
        setMsg('Notification preferences updated!');
        setSnackbar({ open: true, message: 'Notification preferences updated!', severity: 'success' });
        setProfile(p => ({ ...p, notificationPreferences: data.notificationPreferences }));
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, notification: false }));
  };

  const handleDisconnectDiscord = async () => {
    setUpdating(u => ({ ...u, discord: true }));
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ discordId: '', discordUsername: '' })
      });
      const data = await res.json();
      if (res.ok) setProfile(p => ({ ...p, discordId: '', discordUsername: '' }));
      setSnackbar({ open: true, message: 'Discord disconnected.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, discord: false }));
  };

  const handleDisconnectTelegram = async () => {
    setUpdating(u => ({ ...u, telegram: true }));
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ telegramId: '', telegramUsername: '' })
      });
      const data = await res.json();
      if (res.ok) setProfile(p => ({ ...p, telegramId: '', telegramUsername: '' }));
      setSnackbar({ open: true, message: 'Telegram disconnected.', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, telegram: false }));
  };

  return (
    <>
      <Header activeSection={'' as any} onSectionChange={() => {}} />
      <Box
        maxWidth={{ xs: '99%', sm: 400, md: 500 }}
        mx="auto"
        mt={{ xs: 7, sm: 10, md: 13 }}
        px={{ xs: 1, sm: 0 }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: { xs: 1, sm: 2 }, mt: 0, fontSize: { xs: 15, sm: 16 } }}
          variant="outlined"
          fullWidth={true}
        >
          Back
        </Button>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            borderRadius: 3,
            mt: { xs: 2, sm: 3, md: 4 },
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Typography
            variant="h5"
            color="primary"
            fontWeight={700}
            mb={2}
            align="center"
            sx={{ fontSize: { xs: 22, sm: 26, md: 28 } }}
          >
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
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={700} mb={1} color="primary">Notification Preferences</Typography>
          <FormGroup>
            <FormControlLabel
              control={<Checkbox checked={!!profile.notificationPreferences?.email} onChange={e => setProfile(p => ({ ...p, notificationPreferences: { email: e.target.checked, discord: !!p.notificationPreferences?.discord, telegram: !!p.notificationPreferences?.telegram } }))} />}
              label="Email"
            />
            <FormControlLabel
              control={<Checkbox checked={!!profile.notificationPreferences?.discord} onChange={e => setProfile(p => ({ ...p, notificationPreferences: { email: !!p.notificationPreferences?.email, discord: e.target.checked, telegram: !!p.notificationPreferences?.telegram } }))} />}
              label="Discord"
            />
            <FormControlLabel
              control={<Checkbox checked={!!profile.notificationPreferences?.telegram} onChange={e => setProfile(p => ({ ...p, notificationPreferences: { email: !!p.notificationPreferences?.email, discord: !!p.notificationPreferences?.discord, telegram: e.target.checked } }))} />}
              label="Telegram"
            />
          </FormGroup>
          <Button onClick={handleUpdateNotificationPrefs} variant="contained" color="primary" disabled={updating.notification} sx={{ mt: 1, minWidth: 120 }}>
            {updating.notification ? 'Updating...' : 'Save Preferences'}
          </Button>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={700} mb={1} color="primary">Connect Accounts</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Discord:</Typography>
              {profile.discordId ? (
                <Tooltip title={`Connected as ${profile.discordUsername || profile.discordId}`}><span style={{ color: '#7289da', fontWeight: 600 }}>{profile.discordUsername || profile.discordId}</span></Tooltip>
              ) : (
                <Button variant="outlined" color="primary" disabled sx={{ opacity: 0.7 }}>Connect Discord (coming soon)</Button>
              )}
              {profile.discordId && (
                <Button variant="outlined" color="error" onClick={handleDisconnectDiscord} disabled={updating.discord}>Disconnect</Button>
              )}
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Typography>Telegram:</Typography>
              {profile.telegramId ? (
                <Tooltip title={`Connected as ${profile.telegramUsername || profile.telegramId}`}><span style={{ color: '#229ED9', fontWeight: 600 }}>{profile.telegramUsername || profile.telegramId}</span></Tooltip>
              ) : (
                <Button variant="outlined" color="primary" disabled sx={{ opacity: 0.7 }}>Connect Telegram (coming soon)</Button>
              )}
              {profile.telegramId && (
                <Button variant="outlined" color="error" onClick={handleDisconnectTelegram} disabled={updating.telegram}>Disconnect</Button>
              )}
            </Box>
          </Box>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" fontWeight={700} mb={1} color="primary">How to Connect Discord/Telegram</Typography>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              To receive notifications via Discord or Telegram, follow these steps:
            </Typography>
            <ol style={{ marginLeft: 18, marginBottom: 0, color: '#555', fontSize: 15 }}>
              <li>Add the bot to your Discord or Telegram account (see below).</li>
              <li>Send the following code to the bot as a direct message:</li>
            </ol>
            <Box display="flex" alignItems="center" gap={1} mt={1}>
              <Paper sx={{ px: 2, py: 1, bgcolor: '#f7f7fa', fontWeight: 700, fontSize: 16 }}>{userId}</Paper>
              <Tooltip title="Copy code">
                <IconButton onClick={() => {navigator.clipboard.writeText(userId); setSnackbar({ open: true, message: 'Copied!', severity: 'success' });}} size="small"><ContentCopyIcon fontSize="small" /></IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" mt={1}>
              <b>Discord Bot:</b> <a href="https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot" target="_blank" rel="noopener noreferrer">Add to Discord</a><br/>
              <b>Telegram Bot:</b> <a href="https://t.me/PlayM2MNotification_bot" target="_blank" rel="noopener noreferrer">Open in Telegram</a>
            </Typography>
          </Box>
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