import React, { useEffect, useState, useRef } from 'react';
import { IconButton, Badge, Menu, MenuItem, ListItemText, Typography, Box, Button } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { io, Socket } from 'socket.io-client';

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

interface Props {
  userId: string;
  sx?: any;
}

const NotificationBell: React.FC<Props> = ({ userId, sx }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Fetch notifications
    const fetchNotifications = async () => {
      const res = await fetch('/api/admin/notifications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount((data.notifications || []).filter((n: Notification) => !n.read).length);
    };
    fetchNotifications();
  }, []);

  useEffect(() => {
    // Socket.IO for real-time notifications
    const socket = io('http://localhost:5000');
    socketRef.current = socket;
    socket.emit('register-user', { userId });
    socket.on('notification', (notif: Notification) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
    });
    return () => { socket.disconnect(); };
  }, [userId]);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = async (id: string) => {
    await fetch(`/api/admin/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleClear = async () => {
    await Promise.all(
      notifications.filter(n => !n.read).map(n =>
        fetch(`/api/admin/notifications/${n._id}/read`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      )
    );
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <Box>
      <IconButton color="inherit" onClick={handleOpen} size="large" sx={sx}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} PaperProps={{ sx: { minWidth: 320 } }}>
        <Box px={2} py={1} display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle1">Notifications</Typography>
          <Button size="small" onClick={handleClear}>Clear</Button>
        </Box>
        {notifications.length === 0 && <MenuItem disabled>No notifications</MenuItem>}
        {notifications.map(n => (
          <MenuItem key={n._id} selected={!n.read} onClick={() => { handleMarkAsRead(n._id); if (n.link) window.open(n.link, '_blank'); }}>
            <ListItemText
              primary={<span style={{ fontWeight: n.read ? 400 : 700 }}>{n.message}</span>}
              secondary={new Date(n.createdAt).toLocaleString()}
            />
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

export default NotificationBell; 