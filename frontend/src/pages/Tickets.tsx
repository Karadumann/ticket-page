import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, List, ListItem, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Rating } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { io as socketIOClient, Socket } from 'socket.io-client';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  replies: { message: string; user: string; createdAt: string }[];
  nickname?: string;
  screenshotUrls?: string[];
  category?: 'bug' | 'payment' | 'account' | 'suggestion' | 'report_player' | 'technical' | 'other';
  priority?: 'low' | 'medium' | 'high' | 'very_high';
  createdAt?: string;
  updatedAt?: string;
  user?: string;
  assignedTo?: { username: string };
  satisfactionSurvey?: boolean;
}

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [nickname, setNickname] = useState('');
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>(['']);
  const [category, setCategory] = useState('bug');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const fetchTickets = async () => {
    setError('');
    try {
      const res = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Failed to fetch tickets.');
      else setTickets(data.tickets);
    } catch {
      setError('Server error.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUserId(decoded.id);
        setCurrentUserRole(decoded.role);
        if (["admin", "superadmin", "staff", "moderator"].includes(decoded.role)) {
          navigate('/admin');
          return;
        }
      } catch {
        // No need to set isAdmin if not an admin
      }
    }
    fetchTickets();
    // SOCKET.IO: Anlık güncelleme
    const socket: Socket = socketIOClient('http://localhost:5000');
    socket.on('ticket-updated', (updatedTicket: Ticket) => {
      setTickets(prev => prev.map(t => t._id === updatedTicket._id ? updatedTicket : t));
    });
    socket.on('ticket-deleted', (deletedTicketId: string) => {
      setTickets(prev => prev.filter(t => t._id !== deletedTicketId));
    });
    socket.on('new-ticket', (newTicket: Ticket) => {
      setTickets(prev => [newTicket, ...prev]);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!title.trim() || title.length < 3 || title.length > 100) {
      setError('Title must be between 3 and 100 characters.');
      return;
    }
    if (!description.trim() || description.length < 10 || description.length > 1000) {
      setError('Description must be between 10 and 1000 characters.');
      return;
    }
    if (!nickname.trim() || nickname.length < 2 || nickname.length > 60) {
      setError('In-game Nickname must be between 2 and 60 characters.');
      return;
    }
    try {
      const filteredUrls = screenshotUrls.map(url => url.trim()).filter(Boolean);
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description, nickname, screenshotUrls: filteredUrls, category, priority })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || 'Failed to create ticket.');
        setSnackbar({ open: true, message: data.message || 'Failed to create ticket.', severity: 'error' });
      } else {
        setSuccess('Ticket created!');
        setSnackbar({ open: true, message: 'Ticket created!', severity: 'success' });
        setTitle('');
        setDescription('');
        setNickname('');
        setScreenshotUrls(['']);
        fetchTickets();
      }
    } catch {
      setError('Server error.');
      setSnackbar({ open: true, message: 'Server error.', severity: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  // Ticket kartına tıklanınca sadece detay sayfasına yönlendir
  const handleTicketClick = (ticket: Ticket) => {
    navigate(`/tickets/${ticket._id}`);
  };

  return (
    <Box maxWidth={1100} mx="auto" width="100%" minHeight="100vh" position="relative" sx={{ px: { xs: 1, md: 0 }, py: { xs: 2, md: 4 }, bgcolor: 'background.default', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start', justifyContent: 'center' }}>
      <Button onClick={handleLogout} sx={{ position: 'absolute', top: 24, right: 24, minWidth: 0, borderRadius: '50%', p: 1, bgcolor: 'var(--card)', color: 'var(--primary)', boxShadow: 2, fontSize: { xs: 16, md: 18 }, '&:hover': { bgcolor: 'var(--primary)', color: 'var(--card)' } }}>
        <LogoutIcon fontSize="large" />
      </Button>
      <Box flex={1} maxWidth={500} width="100%">
        <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, mb: 2, bgcolor: 'var(--card)', color: 'var(--foreground)', boxShadow: 4, width: '100%' }}>
          <Typography variant="h5" sx={{ color: 'var(--primary)', fontWeight: 800, mb: 2, fontSize: { xs: 20, md: 26 }, letterSpacing: 0.5 }} align="center">
            Create New Ticket
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <TextField
              label="Title"
              value={title}
              onChange={e => setTitle(e.target.value)}
              fullWidth
              required
              margin="normal"
              sx={{ fontSize: { xs: 15, md: 17 } }}
            />
            <TextField
              label="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              fullWidth
              required
              margin="normal"
              multiline
              minRows={3}
              sx={{ fontSize: { xs: 15, md: 17 } }}
            />
            <TextField
              label="In-game Nickname"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              fullWidth
              required
              margin="normal"
              sx={{ fontSize: { xs: 15, md: 17 } }}
            />
            <Box display="flex" gap={2}>
              <TextField
                select
                label="Category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                fullWidth
                required
                SelectProps={{ native: true }}
                sx={{ fontSize: { xs: 15, md: 17 } }}
              >
                <option value="bug">Bug</option>
                <option value="payment">Payment</option>
                <option value="account">Account</option>
                <option value="suggestion">Suggestion</option>
                <option value="report_player">Report Player</option>
                <option value="technical">Technical</option>
                <option value="other">Other</option>
              </TextField>
              <TextField
                select
                label="Priority"
                value={priority}
                onChange={e => setPriority(e.target.value)}
                fullWidth
                required
                SelectProps={{ native: true }}
                sx={{ fontSize: { xs: 15, md: 17 } }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="very_high">Very High</option>
              </TextField>
            </Box>
            {screenshotUrls.map((url, idx) => (
              <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                <TextField
                  label={`Screenshot URL${screenshotUrls.length > 1 ? ` #${idx + 1}` : ''} (optional)`}
                  value={url}
                  onChange={e => {
                    const newUrls = [...screenshotUrls];
                    newUrls[idx] = e.target.value;
                    setScreenshotUrls(newUrls);
                  }}
                  fullWidth
                  margin="normal"
                  type="url"
                  sx={{ fontSize: { xs: 15, md: 17 }, borderRadius: 2 }}
                />
                {idx === screenshotUrls.length - 1 && screenshotUrls.length < 10 && (
                  <Button type="button" variant="outlined" sx={{ minWidth: 36, height: 40, px: 0, fontSize: 24, fontWeight: 700, borderRadius: 2 }} onClick={() => setScreenshotUrls(urls => [...urls, ''])}>+
                  </Button>
                )}
                {idx > 0 && (
                  <Button type="button" variant="outlined" color="error" sx={{ minWidth: 36, height: 40, px: 0, fontSize: 24, fontWeight: 700, borderRadius: 2 }} onClick={() => setScreenshotUrls(urls => urls.filter((_, i) => i !== idx))}>-
                  </Button>
                )}
              </Box>
            ))}
            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 2, bgcolor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 700, fontSize: { xs: 15, md: 17 }, borderRadius: 3, boxShadow: 2, letterSpacing: 0.5, '&:hover': { bgcolor: 'var(--primary-foreground)', color: 'var(--primary)' } }}
              fullWidth
            >
              Create Ticket
            </Button>
          </form>
        </Paper>
      </Box>
      <Box flex={2} maxWidth={600} width="100%">
        <Paper elevation={0} sx={{ p: { xs: 1, md: 3 }, borderRadius: 2, bgcolor: 'transparent', color: 'var(--foreground)', width: '100%' }}>
          <Typography variant="h5" sx={{ color: 'var(--primary)', fontWeight: 800, mb: 3, fontSize: { xs: 20, md: 26 }, letterSpacing: 0.5 }} align="center">
            My Tickets
          </Typography>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            {tickets.length === 0 && (
              <Typography align="center" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 15, md: 17 }, my: 4 }}>No tickets yet.</Typography>
            )}
            {tickets.map(ticket => {
              // Kullanıcı ve assigned bilgisi için badge -> Badge for user and assigned info
              const userBadge = (
                <Typography variant="caption" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 12, ml: 1 }}>
                  User: {ticket.user || '-'}
                </Typography>
              );
              const assignedBadge = ticket.assignedTo ? (
                <Typography variant="caption" sx={{ bgcolor: '#e0f7fa', color: '#00796b', px: 1, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 12, ml: 1 }}>
                  Assigned: {ticket.assignedTo.username}
                </Typography>
              ) : null;
              // Category ve priority renkleri
              let categoryColor = '#e3f2fd';
              let categoryText = '#1976d2';
              switch (ticket.category) {
                case 'bug': categoryColor = '#ffebee'; categoryText = '#d32f2f'; break;
                case 'payment': categoryColor = '#fffde7'; categoryText = '#fbc02d'; break;
                case 'account': categoryColor = '#e3f2fd'; categoryText = '#1976d2'; break;
                case 'suggestion': categoryColor = '#e8f5e9'; categoryText = '#388e3c'; break;
                case 'report_player': categoryColor = '#f3e5f5'; categoryText = '#8e24aa'; break;
                case 'technical': categoryColor = '#e0f7fa'; categoryText = '#00796b'; break;
                case 'other': categoryColor = '#eceff1'; categoryText = '#455a64'; break;
              }
              let priorityLabel = '-';
              let priorityBg = '#e3f2fd';
              let priorityColor = '#222';
              switch (ticket.priority) {
                case 'very_high': priorityLabel = 'Very High'; priorityBg = '#ff1744'; priorityColor = '#fff'; break;
                case 'high': priorityLabel = 'High'; priorityBg = '#ff9100'; priorityColor = '#fff'; break;
                case 'medium': priorityLabel = 'Medium'; priorityBg = '#2979ff'; priorityColor = '#fff'; break;
                case 'low': priorityLabel = 'Low'; priorityBg = '#00e676'; priorityColor = '#222'; break;
                default: priorityLabel = ticket.priority || '-';
              }
              return (
                <React.Fragment key={ticket._id}>
                  <ListItem
                    alignItems="flex-start"
                    component="div"
                    onClick={() => handleTicketClick(ticket)}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 1,
                      mb: 2,
                      bgcolor: ticket.assignedTo && ticket.assignedTo.username === currentUserId ? '#e3f2fd' : 'var(--card)',
                      color: 'var(--foreground)',
                      boxShadow: 2,
                      p: { xs: 3, md: 4 },
                      minWidth: { xs: 320, sm: 400, md: 600 },
                      maxWidth: { xs: '100%', sm: 700, md: 900 },
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      overflow: 'hidden',
                    }}
                  >
                    {/* Üst bilgi alanı -> Header info area */}
                    <Box mb={1}>
                      {/* İlk satır: Category, Priority, Created, Updated yan yana */}
                      <Box display="flex" gap={1} alignItems="center" flexWrap="wrap" mb={0.5}>
                        <Typography variant="caption" sx={{ bgcolor: categoryColor, color: categoryText, px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 13, letterSpacing: 0.5, minWidth: 60, textAlign: 'center' }}>
                          {ticket.category ? (ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1).replace('_', ' ')) : '-'}
                        </Typography>
                        <Typography variant="caption" sx={{ bgcolor: priorityBg, color: priorityColor, px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 13, letterSpacing: 0.5, minWidth: 60, textAlign: 'center' }}>
                          {priorityLabel}
                        </Typography>
                        {ticket.createdAt ? <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', color: '#888', px: 1, py: 0.5, borderRadius: 2, fontWeight: 600, fontSize: 12 }}>Created: {new Date(ticket.createdAt).toLocaleDateString()}</Typography> : null}
                        {ticket.updatedAt ? <Typography variant="caption" sx={{ bgcolor: '#f5f5f5', color: '#888', px: 1, py: 0.5, borderRadius: 2, fontWeight: 600, fontSize: 12 }}>Updated: {new Date(ticket.updatedAt).toLocaleDateString()}</Typography> : null}
                      </Box>
                      {/* Alt satır: Solda user, sağda status -> Bottom row: user on the left, status on the right */}
                      <Box display="flex" alignItems="center" width="100%">
                        <Box>{userBadge}</Box>
                        {assignedBadge}
                      </Box>
                    </Box>
                    {/* Title */}
                    <Typography variant="h6" sx={{ color: 'var(--primary)', fontWeight: 700, fontSize: { xs: 18, md: 22 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 200, md: 400 }, mb: 0.5 }}>
                      {ticket.title}
                    </Typography>
                    <Box display="flex" gap={2} flexWrap="wrap" mb={1}>
                      <Typography variant="body2" sx={{ color: 'var(--primary)', fontWeight: 600, fontSize: { xs: 13, md: 15 } }}><b>Nickname:</b> {ticket.nickname || '-'}</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'var(--foreground)', fontSize: { xs: 14, md: 16 }, mb: 1, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', maxWidth: '100%' }}>
                      <b>Description:</b> {ticket.description}
                    </Typography>
                    {(ticket.screenshotUrls?.length ?? 0) > 0 && (
                      <Box mb={1} display="flex" flexDirection="column" gap={0.5}>
                        {(ticket.screenshotUrls || []).map((url, i) => (
                          <Typography key={i} variant="body2" sx={{ color: 'var(--primary)', fontSize: { xs: 13, md: 15 } }}>
                            <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Screenshot {ticket.screenshotUrls && ticket.screenshotUrls.length > 1 ? `#${i + 1}` : ''}</a>
                          </Typography>
                        ))}
                      </Box>
                    )}
                    <Box display="flex" gap={2} flexWrap="wrap" mb={1} alignItems="center">
                      <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 15 } }}><b>Replies:</b> {ticket.replies?.length || 0}</Typography>
                    </Box>
                    <Box display="flex" justifyContent="flex-end" alignItems="center" width="100%" mt={2}>
                      <Box
                        sx={{
                          px: 2,
                          py: 0.5,
                          borderRadius: '9999px',
                          fontWeight: 700,
                          fontSize: { xs: 13, md: 15 },
                          bgcolor:
                            ticket.status === 'open'
                              ? 'rgba(34,197,94,0.15)'
                              : ticket.status === 'in_progress'
                              ? 'rgba(251,191,36,0.15)'
                              : ticket.status === 'resolved'
                              ? 'rgba(63,167,255,0.15)'
                              : 'rgba(239,68,68,0.15)',
                          color:
                            ticket.status === 'open'
                              ? '#22c55e'
                              : ticket.status === 'in_progress'
                              ? '#fbbf24'
                              : ticket.status === 'resolved'
                              ? '#3fa7ff'
                              : '#ef4444',
                          border: '2px solid',
                          borderColor:
                            ticket.status === 'open'
                              ? '#22c55e'
                              : ticket.status === 'in_progress'
                              ? '#fbbf24'
                              : ticket.status === 'resolved'
                              ? '#3fa7ff'
                              : '#ef4444',
                          textTransform: 'capitalize',
                          minWidth: 80,
                          textAlign: 'center',
                        }}
                      >
                        {ticket.status.replace('_', ' ')}
                      </Box>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
          </List>
        </Paper>
      </Box>
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

export default Tickets; 