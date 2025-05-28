import React, { useEffect, useState } from 'react';
import { Box, Typography, Button, Avatar, IconButton } from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import Tooltip from '@mui/material/Tooltip';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  activeSection: 'dashboard' | 'users' | 'tickets' | 'logs' | '';
  onSectionChange: (section: 'dashboard' | 'users' | 'tickets' | 'logs') => void;
  isAdmin?: boolean;
  onLogout?: () => void;
  userId?: string;
  showLogsTab?: boolean;
}

const Header: React.FC<HeaderProps> = ({ activeSection, onSectionChange, isAdmin, onLogout, userId, showLogsTab = true }) => {
  const navigate = useNavigate();
  const [adminInfo, setAdminInfo] = useState<{ username: string; avatar: string }>({ username: '', avatar: '' });
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok) setAdminInfo({ username: data.username || data.email || 'Admin', avatar: data.avatar || '' });
      } catch {}
    };
    fetchMe();
  }, []);
  return (
    <Box
      component="header"
      sx={{
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1300,
        bgcolor: 'var(--sidebar)',
        color: 'var(--sidebar-foreground)',
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1, sm: 2, md: 4, xl: 8 },
        py: { xs: 1, md: 2 },
        minHeight: { xs: 56, md: 72 },
        gap: 2,
      }}
    >
      <Typography variant="h6" fontWeight={700} color="var(--primary)" sx={{ fontSize: { xs: 18, md: 24, xl: 28 } }}>Admin Menu</Typography>
      <Box display="flex" gap={2} alignItems="center">
        <Button
          variant={activeSection === 'dashboard' ? 'contained' : 'text'}
          sx={{
            bgcolor: activeSection === 'dashboard' ? 'var(--primary)' : 'transparent',
            color: activeSection === 'dashboard' ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
            fontWeight: 700,
            borderRadius: '9999px',
            fontSize: { xs: 14, md: 18 },
            px: { xs: 2, md: 4 },
            boxShadow: activeSection === 'dashboard' ? '0 2px 12px 0 var(--primary)' : 'none',
            '&:hover': { bgcolor: 'var(--primary)', color: 'var(--primary-foreground)' }
          }}
          onClick={() => onSectionChange('dashboard')}
        >
          Dashboard
        </Button>
        <Button
          variant={activeSection === 'users' ? 'contained' : 'text'}
          sx={{
            bgcolor: activeSection === 'users' ? 'var(--primary)' : 'transparent',
            color: activeSection === 'users' ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
            fontWeight: 700,
            borderRadius: '9999px',
            fontSize: { xs: 14, md: 18 },
            px: { xs: 2, md: 4 },
            boxShadow: activeSection === 'users' ? '0 2px 12px 0 var(--primary)' : 'none',
            '&:hover': { bgcolor: 'var(--primary)', color: 'var(--primary-foreground)' }
          }}
          onClick={() => navigate('/admin?section=users')}
        >
          Users
        </Button>
        <Button
          variant={activeSection === 'tickets' ? 'contained' : 'text'}
          sx={{
            bgcolor: activeSection === 'tickets' ? 'var(--primary)' : 'transparent',
            color: activeSection === 'tickets' ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
            fontWeight: 700,
            borderRadius: '9999px',
            fontSize: { xs: 14, md: 18 },
            px: { xs: 2, md: 4 },
            boxShadow: activeSection === 'tickets' ? '0 2px 12px 0 var(--primary)' : 'none',
            '&:hover': { bgcolor: 'var(--primary)', color: 'var(--primary-foreground)' }
          }}
          onClick={() => onSectionChange('tickets')}
        >
          Tickets
        </Button>
        {showLogsTab && isAdmin && (
          <Button
            variant={activeSection === 'logs' ? 'contained' : 'text'}
            sx={{
              bgcolor: activeSection === 'logs' ? 'var(--primary)' : 'transparent',
              color: activeSection === 'logs' ? 'var(--primary-foreground)' : 'var(--sidebar-foreground)',
              fontWeight: 700,
              borderRadius: '9999px',
              fontSize: { xs: 14, md: 18 },
              px: { xs: 2, md: 4 },
              boxShadow: activeSection === 'logs' ? '0 2px 12px 0 var(--primary)' : 'none',
              '&:hover': { bgcolor: 'var(--primary)', color: 'var(--primary-foreground)' }
            }}
            onClick={() => onSectionChange('logs')}
          >
            Logs
          </Button>
        )}
        {userId && <NotificationBell userId={userId} sx={{ color: '#23232b', '&:hover': { bgcolor: '#e3f2fd' } }} />}
        <Button onClick={() => navigate('/profile')} sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2, bgcolor: 'transparent', color: 'var(--primary)', fontWeight: 700, px: 1.5, py: 0.5, borderRadius: 2, '&:hover': { bgcolor: '#e3f2fd' } }}>
          <Avatar src={adminInfo.avatar} sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: 18 }}>
            {(!adminInfo.avatar) ? adminInfo.username?.[0]?.toUpperCase() : ''}
          </Avatar>
          <span style={{ fontSize: 15 }}>{adminInfo.username}</span>
        </Button>
        {onLogout && (
          <Tooltip title="Logout">
            <IconButton onClick={onLogout} sx={{ ml: 1, bgcolor: '#ff5252', color: '#fff', '&:hover': { bgcolor: '#d32f2f' } }}>
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
};

interface UserHeaderProps {
  username?: string;
  avatar?: string;
  onLogout?: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ username, avatar, onLogout }) => {
  return (
    <Box
      component="header"
      sx={{
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 1300,
        bgcolor: 'var(--sidebar)',
        color: 'var(--sidebar-foreground)',
        boxShadow: 2,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: { xs: 1, sm: 2, md: 4, xl: 8 },
        py: { xs: 1, md: 2 },
        minHeight: { xs: 56, md: 72 },
        gap: 2,
      }}
    >
      <Typography variant="h6" fontWeight={700} color="var(--primary)" sx={{ fontSize: { xs: 18, md: 24, xl: 28 } }}>
        My Tickets
      </Typography>
      <Box display="flex" alignItems="center" gap={2}>
        <Button component={Link} to="/tickets" color="inherit" sx={{ fontWeight: 700, fontSize: 16 }}>
          Tickets
        </Button>
        <Button component={Link} to="/profile" color="inherit" sx={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar src={avatar} sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: 18 }}>
            {(!avatar && username) ? username[0]?.toUpperCase() : ''}
          </Avatar>
          <span style={{ fontSize: 15 }}>{username}</span>
        </Button>
        <Tooltip title="Logout">
          <Button onClick={onLogout} color="inherit" sx={{ minWidth: 0, p: 1, ml: 1, borderRadius: '50%' }}>
            <LogoutIcon fontSize="medium" />
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default Header; 