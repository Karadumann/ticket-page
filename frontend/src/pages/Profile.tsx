import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, TextField, Button, Alert, Snackbar, Checkbox, FormControlLabel, FormGroup, Divider, Tooltip, IconButton } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Header, { UserHeader } from '../components/Header';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { IconButton as MuiIconButton } from '@mui/material';
import { Alert as MuiAlert } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import NotificationBell from '../components/NotificationBell';

interface UserProfile {
  username: string;
  email: string;
  avatar?: string;
  notificationPreferences?: {
    email: boolean;
    discord: boolean;
    discordMuted?: boolean;
    discordMuteUntil?: string | null;
  };
  discordId?: string;
  discordUsername?: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile>({ username: '', email: '', notificationPreferences: { email: true, discord: false }, discordId: '', discordUsername: '' });
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [updating, setUpdating] = useState<{ avatar?: boolean; username?: boolean; email?: boolean; password?: boolean; notification?: boolean; discord?: boolean }>({});
  const [userId, setUserId] = useState<string>('');
  const [muteDialogOpen, setMuteDialogOpen] = useState(false);
  const [muteDuration, setMuteDuration] = useState<'60' | '1440' | 'forever'>('60');
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (res.ok) {
          setProfile({ username: data.username, email: data.email, avatar: data.avatar, notificationPreferences: data.notificationPreferences, discordId: data.discordId, discordUsername: data.discordUsername });
          setUserId(data._id || '');
        }
      } catch {}
    };
    // Admin kontrolü
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setIsAdmin(["admin", "superadmin", "staff", "moderator"].includes(decoded.role));
      } catch {}
    }
    fetchProfile();
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) setProfile({ username: data.username, email: data.email, avatar: data.avatar, notificationPreferences: data.notificationPreferences, discordId: data.discordId, discordUsername: data.discordUsername });
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
        setProfile(p => ({
          ...p,
          notificationPreferences: {
            email: p.notificationPreferences?.email ?? false,
            discord: p.notificationPreferences?.discord ?? false,
            ...p.notificationPreferences,
            discordMuted: true,
            discordMuteUntil: data.user?.notificationPreferences?.discordMuteUntil
          }
        }));
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

  const handleMuteDiscord = async () => {
    setUpdating(u => ({ ...u, notification: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me/discord-mute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ duration: muteDuration })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to mute Discord notifications.');
        setSnackbar({ open: true, message: data.message || 'Failed to mute Discord notifications.', severity: 'error' });
      } else {
        setMsg('Discord notifications muted!');
        setSnackbar({ open: true, message: 'Discord notifications muted!', severity: 'success' });
        setProfile(p => ({
          ...p,
          notificationPreferences: {
            email: p.notificationPreferences?.email ?? false,
            discord: p.notificationPreferences?.discord ?? false,
            ...p.notificationPreferences,
            discordMuted: true,
            discordMuteUntil: data.user?.notificationPreferences?.discordMuteUntil
          }
        }));
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, notification: false }));
    setMuteDialogOpen(false);
  };

  const handleUnmuteDiscord = async () => {
    setUpdating(u => ({ ...u, notification: true }));
    setMsg(''); setError('');
    try {
      const res = await fetch('/api/auth/me/discord-unmute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to unmute Discord notifications.');
        setSnackbar({ open: true, message: data.message || 'Failed to unmute Discord notifications.', severity: 'error' });
      } else {
        setMsg('Discord notifications unmuted!');
        setSnackbar({ open: true, message: 'Discord notifications unmuted!', severity: 'success' });
        setProfile(p => ({
          ...p,
          notificationPreferences: {
            email: p.notificationPreferences?.email ?? false,
            discord: p.notificationPreferences?.discord ?? false,
            ...p.notificationPreferences,
            discordMuted: false,
            discordMuteUntil: null
          }
        }));
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
    setUpdating(u => ({ ...u, notification: false }));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <>
      {isAdmin ? (
        <Header activeSection={''} onSectionChange={section => navigate('/' + section)} userId={userId} onLogout={handleLogout} isAdmin />
      ) : (
        <UserHeader username={profile.username} avatar={profile.avatar} onLogout={handleLogout} />
      )}
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
              control={<Checkbox checked={!!profile.notificationPreferences?.email} onChange={e => setProfile(p => ({ ...p, notificationPreferences: { email: e.target.checked, discord: !!p.notificationPreferences?.discord } }))} />}
              label="Email"
            />
            <FormControlLabel
              control={<Checkbox checked={!!profile.notificationPreferences?.discord} onChange={e => setProfile(p => ({ ...p, notificationPreferences: { email: !!p.notificationPreferences?.email, discord: e.target.checked } }))} />}
              label="Discord"
            />
          </FormGroup>
          {(profile.notificationPreferences?.discord || profile.discordId) && (
            <MuiAlert severity="info" sx={{ mt: 2, mb: 1 }}>
              To receive Discord notifications, you must <b>stay in the Discord server</b> and enable <b>"Allow direct messages from server members"</b> in your Discord privacy settings.<br/>
              <a href="https://discord.com/invite/playm2m" target="_blank" rel="noopener noreferrer">Join the Server</a>
            </MuiAlert>
          )}
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
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => {
                    const token = localStorage.getItem('token');
                    const discordOAuthUrl = `https://discord.com/oauth2/authorize?client_id=1309860543707746395&redirect_uri=http://localhost:5000/api/auth/discord/callback&response_type=code&scope=identify%20guilds&state=${token}`;
                    window.location.href = discordOAuthUrl;
                  }}
                >
                  Connect Discord
                </Button>
              )}
              {profile.discordId && (
                <Button variant="outlined" color="error" onClick={handleDisconnectDiscord} disabled={updating.discord}>Disconnect</Button>
              )}
            </Box>
            {!profile.discordId && (
              <MuiAlert severity="info" sx={{ mt: 1 }}>
                You must connect your Discord account to receive notifications.
              </MuiAlert>
            )}
          </Box>
          {profile.notificationPreferences?.discord && profile.discordId && (
            <Box mt={2} mb={2}>
              {profile.notificationPreferences.discordMuted ? (
                <>
                  <MuiAlert severity="warning" sx={{ mb: 1 }}>
                    Discord notifications are muted.
                    {profile.notificationPreferences.discordMuteUntil && (
                      <><br/>Mute ends: {new Date(profile.notificationPreferences.discordMuteUntil).toLocaleString()}</>
                    )}
                  </MuiAlert>
                  <Button variant="contained" color="success" onClick={handleUnmuteDiscord} disabled={updating.notification} sx={{ minWidth: 120, mr: 1 }}>
                    {updating.notification ? 'Updating...' : 'Unmute Discord'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outlined" color="warning" onClick={() => setMuteDialogOpen(true)} sx={{ minWidth: 120, mr: 1 }}>
                    Mute Discord
                  </Button>
                </>
              )}
            </Box>
          )}
          {muteDialogOpen && (
            <Paper elevation={6} sx={{ p: 3, position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1300, minWidth: 300 }}>
              <Typography variant="h6" mb={2}>Mute Discord Notifications</Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Button variant={muteDuration === '60' ? 'contained' : 'outlined'} onClick={() => setMuteDuration('60')}>1 hour</Button>
                <Button variant={muteDuration === '1440' ? 'contained' : 'outlined'} onClick={() => setMuteDuration('1440')}>1 day</Button>
                <Button variant={muteDuration === 'forever' ? 'contained' : 'outlined'} onClick={() => setMuteDuration('forever')}>Forever</Button>
                <Box display="flex" gap={2} mt={2}>
                  <Button variant="contained" color="primary" onClick={handleMuteDiscord} disabled={updating.notification}>Mute</Button>
                  <Button variant="outlined" color="secondary" onClick={() => setMuteDialogOpen(false)}>Cancel</Button>
                </Box>
              </Box>
            </Paper>
          )}
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