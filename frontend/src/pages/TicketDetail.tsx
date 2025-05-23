import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Paper, Button, CircularProgress, TextField, Alert, Tabs, Tab, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Rating, Select, MenuItem, FormControl, InputLabel, Snackbar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { jwtDecode } from 'jwt-decode';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { Alert as MuiAlert } from '@mui/material';

interface Reply {
  message: string;
  user: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  replies: Reply[];
  nickname?: string;
  screenshotUrls?: string[];
  priority?: string;
  satisfactionSurvey?: {
    rating: number;
    comment: string;
    submittedAt: string;
  };
  category?: string;
  assignedTo?: {
    username: string;
    role: string;
  };
  labels?: string[];
  [key: string]: any;
}

interface User {
  _id: string;
  username: string;
  role: string;
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [replyMsg, setReplyMsg] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [viewers, setViewers] = useState<{ userId: string, username: string, role: string }[]>([]);
  const [typers, setTypers] = useState<{ userId: string, username: string, role: string }[]>([]);
  const [socketRef, setSocketRef] = useState<Socket | null>(null);
  const [tab, setTab] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);
  const [surveyRating, setSurveyRating] = useState(5);
  const [surveyComment, setSurveyComment] = useState('');
  const [surveyStatus, setSurveyStatus] = useState('');
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [assignSuccess, setAssignSuccess] = useState('');
  const [selectedAssignee, setSelectedAssignee] = useState(
    (ticket?.assignedTo && (ticket.assignedTo as any)._id) || ticket?.assignedTo || ''
  );

  let canReply = true;
  if (ticket && ticket.status === 'closed') {
    canReply = false;
  }

  useEffect(() => {
    let socket: Socket | null = null;
    let userId = '';
    let username = '';
    let role = '';
    const token = localStorage.getItem('token');
    let isAdmin = false;
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        userId = decoded.id;
        username = decoded.username || decoded.email || decoded.id;
        role = decoded.role;
        isAdmin = ['admin', 'superadmin', 'staff', 'moderator'].includes(role);
      } catch {}
    }
    if (id) {
      socket = socketIOClient('http://localhost:5000');
      setSocketRef(socket);
      socket.emit('join-ticket', { ticketId: id });
      socket.on('ticket-updated', async (updatedTicket: any) => {
        if (updatedTicket && updatedTicket._id === id) {
          setTicket(updatedTicket);
          // Refetch users for new replies
          if (updatedTicket && updatedTicket.replies) {
            const userIds = [updatedTicket.user, ...(updatedTicket.replies?.map((r: any) => r.user) || [])];
            const uniqueIds = Array.from(new Set(userIds));
            const userInfos = await Promise.all(uniqueIds.map(async uid => {
              const res = await fetch(`/api/users/${uid}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
              return res.ok ? await res.json() : { _id: uid, username: uid, role: 'user' };
            }));
            setUsers(userInfos);
          }
        }
      });
      if (isAdmin) {
        socket.emit('viewing-ticket', { ticketId: id, userId, username, role });
        socket.on('viewing-ticket-update', (data: any) => {
          if (data.ticketId === id) {
            setViewers(data.viewers.filter((v: any) => v.userId !== userId));
          }
        });
        socket.on('typing-reply-update', (data: any) => {
          if (data.ticketId === id) {
            setTypers(data.typers.filter((v: any) => v.userId !== userId));
          }
        });
      }
    }
    return () => {
      if (socket && id) {
        socket.emit('leave-ticket', { ticketId: id });
        if (isAdmin) {
          socket.emit('stop-viewing-ticket', { ticketId: id, userId });
          socket.emit('stop-typing-reply', { ticketId: id, userId });
        }
        socket.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      setError('');
      let isAdmin = false;
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          isAdmin = ['admin', 'superadmin', 'staff', 'moderator'].includes(decoded.role);
        }
        const url = isAdmin ? `/api/admin/tickets/${id}` : `/api/tickets/${id}`;
        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (!res.ok) setError(data.message || 'Failed to fetch ticket.');
        else setTicket(data);
        // Fetch users for display
        if (isAdmin) {
          const usersRes = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
          const usersData = await usersRes.json();
          if (usersRes.ok) setUsers(usersData.users || []);
        } else if (data && data.user) {
          // Fetch ticket owner and reply users
          const userIds = [data.user, ...(data.replies?.map((r: any) => r.user) || [])];
          const uniqueIds = Array.from(new Set(userIds));
          const userInfos = await Promise.all(uniqueIds.map(async uid => {
            const res = await fetch(`/api/users/${uid}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
            return res.ok ? await res.json() : { _id: uid, username: uid, role: 'user' };
          }));
          setUsers(userInfos);
        }
      } catch {
        setError('Server error.');
      }
      setLoading(false);
    };
    fetchTicket();
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchLogs = async () => {
      try {
        const res = await fetch(`/api/admin/tickets/${id}/logs`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const data = await res.json();
        if (res.ok) setLogs(data.logs || []);
      } catch {}
    };
    fetchLogs();
  }, [id]);

  const getUsername = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user ? user.username : userId;
  };

  const getUserRole = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user ? user.role : '';
  };

  // Typing eventleri
  const handleReplyInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setReplyMsg(e.target.value);
    const token = localStorage.getItem('token');
    if (socketRef && token) {
      try {
        const decoded: any = jwtDecode(token);
        if (["admin", "superadmin", "staff", "moderator"].includes(decoded.role)) {
          socketRef.emit('typing-reply', { ticketId: id, userId: decoded.id, username: decoded.username || decoded.email || decoded.id, role: decoded.role });
        }
      } catch {}
    }
  };
  const handleReplyBlur = () => {
    const token = localStorage.getItem('token');
    if (socketRef && token) {
      try {
        const decoded: any = jwtDecode(token);
        if (["admin", "superadmin", "staff", "moderator"].includes(decoded.role)) {
          socketRef.emit('stop-typing-reply', { ticketId: id, userId: decoded.id });
        }
      } catch {}
    }
  };

  // User identity and role
  let currentUserId = '';
  let currentUserRole = '';
  let isAdmin = false;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      currentUserId = decoded.id;
      currentUserRole = decoded.role;
      isAdmin = ['admin', 'superadmin', 'staff', 'moderator'].includes(currentUserRole);
    } catch {}
  }
  const isTicketOwner = ticket && ticket.user === currentUserId && currentUserRole === 'user';
  const canShowSurveyButton = ticket && ticket.status === 'closed' && !ticket.satisfactionSurvey && isTicketOwner;

  // Determine if another admin is typing
  const otherAdminTyping = isAdmin && typers.length > 0 && !typers.some(v => v.userId === currentUserId);
  const typingAdminNames = typers.map(v => {
    let displayName = v.username;
    if (!displayName || /^[a-f0-9]{24}$/.test(displayName)) {
      const userObj = users.find(u => u._id === v.userId);
      displayName = userObj?.username || 'Unknown';
    }
    return displayName;
  });

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  if (error) {
    let displayError = error;
    if (error === 'Ticket not found.') displayError = 'Ticket not found.';
    if (error === 'Server error.') displayError = 'Server error.';
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><Typography color="error">{displayError}</Typography></Box>;
  }
  if (!ticket) return null;

  return (
    <Box maxWidth={900} mx="auto" mt={{ xs: 2, md: 6 }} boxSizing="border-box" sx={{ overflowX: 'hidden', px: { xs: 0.5, sm: 1, md: 0 } }}>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2, bgcolor: 'var(--card)', color: 'var(--primary)', fontSize: { xs: 13, md: 16 }, px: { xs: 1, md: 3 }, minWidth: { xs: 36, md: 64 }, borderRadius: 2, width: { xs: '100%', sm: 'auto' } }}>
        Back
      </Button>
      {isAdmin && (
        <Box mb={2} display="flex" gap={2} alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
          <Button variant="outlined" color="primary" onClick={() => navigate('/admin')} sx={{ fontWeight: 700, width: { xs: '100%', sm: 'auto' } }}>
            Go to the Admin Panel
          </Button>
        </Box>
      )}
      {/* Diğer admin/moderator izliyorsa uyarı */}
      {viewers.length > 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {viewers.map((v, i) => {
            let displayName = v.username;
            // Fallback: if username is missing or looks like an ObjectId, try to get from users array
            if (!displayName || /^[a-f0-9]{24}$/.test(displayName)) {
              const userObj = users.find(u => u._id === v.userId);
              displayName = userObj?.username || 'Unknown';
            }
            return (
              <span key={v.userId}>
                {v.role} <b>{displayName}</b> viewing this ticket{viewers.length > 1 && i < viewers.length - 1 ? ', ' : ''}
              </span>
            );
          })}
        </Alert>
      )}
      {/* Diğer admin/moderator reply yazıyorsa uyarı */}
      {typers.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {typers.map((v, i) => {
            let displayName = v.username;
            if (!displayName || /^[a-f0-9]{24}$/.test(displayName)) {
              const userObj = users.find(u => u._id === v.userId);
              displayName = userObj?.username || 'Unknown';
            }
            return (
              <span key={v.userId}>
                {v.role} <b>{displayName}</b> is typing a reply...{typers.length > 1 && i < viewers.length - 1 ? ', ' : ''}
              </span>
            );
          })}
        </Alert>
      )}
      <Paper elevation={4} sx={{ p: { xs: 1, sm: 2, md: 4 }, borderRadius: 4, mb: 4, bgcolor: 'var(--card)', color: 'var(--foreground)', boxShadow: 6, position: 'relative', width: '100%' }}>
        {/* Status badge at top right, only show on Details tab */}
        {tab === 0 && (
          <Box
            sx={{
              display: { xs: 'flex', md: 'block' },
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'flex-start', md: 'unset' },
              gap: { xs: 1, md: 0 },
              position: 'relative',
              mb: { xs: 2, md: 0 },
            }}
          >
            <Box
              sx={{
                position: { xs: 'static', md: 'absolute' },
                top: { md: 24 },
                right: { md: 24 },
                px: 2,
                py: 0.5,
                borderRadius: '9999px',
                fontWeight: 700,
                fontSize: { xs: 14, md: 16 },
                bgcolor:
                  ticket.status === 'open'
                    ? 'rgba(34,197,94,0.15)'
                    : ticket.status === 'pending'
                    ? 'rgba(251,191,36,0.15)'
                    : ticket.status === 'in_progress'
                    ? 'rgba(63,167,255,0.15)'
                    : 'rgba(239,68,68,0.15)',
                color:
                  ticket.status === 'open'
                    ? '#22c55e'
                    : ticket.status === 'pending'
                    ? '#fbbf24'
                    : ticket.status === 'in_progress'
                    ? '#3fa7ff'
                    : '#ef4444',
                border: '2px solid',
                borderColor:
                  ticket.status === 'open'
                    ? '#22c55e'
                    : ticket.status === 'pending'
                    ? '#fbbf24'
                    : ticket.status === 'in_progress'
                    ? '#3fa7ff'
                    : '#ef4444',
                textTransform: 'capitalize',
                zIndex: 10,
                minWidth: 90,
                textAlign: 'center',
                mb: { xs: 1, md: 0 },
              }}
            >
              {ticket.status.replace('_', ' ')}
            </Box>
          </Box>
        )}
        <Tabs value={tab} onChange={(_, v) => setTab(Number(v))} sx={{ mb: 2, minHeight: { xs: 36, md: 48 }, mt: { xs: 0, md: 0 } }}>
          <Tab label="Details" sx={{ fontSize: { xs: 13, md: 16 } }} />
          <Tab label="History & Survey" sx={{ fontSize: { xs: 13, md: 16 } }} />
        </Tabs>
        {tab === 0 && (
          <>
            {/* Ticket Details + Replies + Reply Form */}
            <Box display="flex" alignItems={{ xs: 'flex-start', md: 'center' }} flexDirection={{ xs: 'column', md: 'row' }} gap={2} mb={2}>
              <Box flex={1} width="100%">
                {/* Meta Info Top Row */}
                <Box display="flex" flexWrap="wrap" gap={2} mb={3} alignItems="center" flexDirection={{ xs: 'column', sm: 'row' }}>
                  {/* Category */}
                  {isAdmin ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel id="category-select-label">Category</InputLabel>
                      <Select
                        labelId="category-select-label"
                        value={ticket.category || ''}
                        label="Category"
                        onChange={async e => {
                          const newCategory = e.target.value;
                          const res = await fetch(`/api/admin/tickets/${ticket._id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ category: newCategory })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setTicket(data);
                          }
                        }}
                      >
                        <MenuItem value="bug">Bug</MenuItem>
                        <MenuItem value="payment">Payment</MenuItem>
                        <MenuItem value="account">Account</MenuItem>
                        <MenuItem value="suggestion">Suggestion</MenuItem>
                        <MenuItem value="report_player">Report Player</MenuItem>
                        <MenuItem value="technical">Technical</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}>
                      <b>Category:</b> {ticket.category ? ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1).replace('_', ' ') : '-'}
                    </Typography>
                  )}
                  {/* Priority */}
                  {isAdmin ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel id="priority-select-label">Priority</InputLabel>
                      <Select
                        labelId="priority-select-label"
                        value={ticket.priority || ''}
                        label="Priority"
                        onChange={async e => {
                          const newPriority = e.target.value;
                          const res = await fetch(`/api/admin/tickets/${ticket._id}`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ priority: newPriority })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setTicket(data);
                          }
                        }}
                      >
                        <MenuItem value="very_high">Very High</MenuItem>
                        <MenuItem value="high">High</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="low">Low</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}>
                      <b>Priority:</b> {ticket.priority ? (ticket.priority === 'very_high' ? 'Very High' : ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)) : '-'}
                    </Typography>
                  )}
                  {/* Status */}
                  {isAdmin ? (
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel id="status-select-label">Status</InputLabel>
                      <Select
                        labelId="status-select-label"
                        value={ticket.status || ''}
                        label="Status"
                        onChange={async e => {
                          const newStatus = e.target.value;
                          const res = await fetch(`/api/admin/tickets/${ticket._id}/status`, {
                            method: 'PATCH',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${localStorage.getItem('token')}`
                            },
                            body: JSON.stringify({ status: newStatus })
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setTicket(data);
                          }
                        }}
                      >
                        <MenuItem value="open">Open</MenuItem>
                        <MenuItem value="in_progress">In Progress</MenuItem>
                        <MenuItem value="resolved">Resolved</MenuItem>
                        <MenuItem value="closed">Closed</MenuItem>
                      </Select>
                    </FormControl>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}>
                      <b>Status:</b> {ticket.status ? ticket.status.replace('_', ' ') : '-'}
                    </Typography>
                  )}
                  {/* Created */}
                  <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}>
                    <b>Created:</b> {new Date(ticket.createdAt).toLocaleString()}
                  </Typography>
                  {/* User */}
                  <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}>
                    <b>User:</b> {getUsername(ticket.user)}
                  </Typography>
                  {/* Assigned */}
                  {isAdmin ? (
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}><b>Assigned:</b></Typography>
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id="assign-select-label">Assignee</InputLabel>
                        <Select
                          labelId="assign-select-label"
                          value={selectedAssignee}
                          label="Assignee"
                          onChange={async e => {
                            setSelectedAssignee(e.target.value);
                            setAssignError('');
                            setAssignSuccess('');
                            setAssigning(true);
                            try {
                              const res = await fetch(`/api/admin/tickets/${ticket._id}/assign`, {
                                method: 'PATCH',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${localStorage.getItem('token')}`
                                },
                                body: JSON.stringify({ assignedTo: e.target.value || null })
                              });
                              const data = await res.json();
                              if (res.ok) {
                                setTicket(data);
                                setAssignSuccess('Assigned successfully.');
                                setSelectedAssignee((data.assignedTo as any)?._id || data.assignedTo || '');
                              } else {
                                setAssignError(data.message || 'Failed to assign.');
                              }
                            } catch {
                              setAssignError('Server error.');
                            }
                            setAssigning(false);
                          }}
                          disabled={assigning}
                        >
                          <MenuItem value="">Unassigned</MenuItem>
                          {users.filter(u => ['admin','superadmin','staff','moderator'].includes(u.role)).map(u => (
                            <MenuItem key={u._id} value={u._id}>{u.username} ({u.role})</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <Snackbar open={!!assignError} autoHideDuration={4000} onClose={() => setAssignError('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 24, zIndex: 2000 }}>
                        <MuiAlert onClose={() => setAssignError('')} severity="error" sx={{ width: '100%' }}>{assignError}</MuiAlert>
                      </Snackbar>
                      <Snackbar open={!!assignSuccess} autoHideDuration={2000} onClose={() => setAssignSuccess('')} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ mt: 24, zIndex: 2000 }}>
                        <MuiAlert onClose={() => setAssignSuccess('')} severity="success" sx={{ width: '100%' }}>{assignSuccess}</MuiAlert>
                      </Snackbar>
                    </Box>
                  ) : (
                    <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 13, md: 16 } }}>
                      <b>Assigned:</b> {ticket.assignedTo ? `${ticket.assignedTo.username} (${ticket.assignedTo.role})` : 'Unassigned'}
                    </Typography>
                  )}
                </Box>
                {/* Title */}
                <Box display="flex" alignItems="center" gap={1.5} mb={1} flexDirection="row">
                  <Typography variant="subtitle1" sx={{ color: 'var(--muted-foreground)', fontWeight: 700, fontSize: { xs: 15, md: 18 }, minWidth: 100, textAlign: 'left' }}>Title:</Typography>
                  <Typography variant="h5" sx={{ color: 'var(--primary)', fontWeight: 700, wordBreak: 'break-word', whiteSpace: 'pre-line', fontSize: { xs: 16, md: 22 }, textAlign: 'left' }}>{ticket.title}</Typography>
                </Box>
                {/* Labels */}
                {isAdmin ? (
                  <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center" gap={2} mb={1}>
                    <TextField
                      label="Labels (comma separated)"
                      value={Array.isArray(ticket.labels) ? ticket.labels.join(', ') : ''}
                      onChange={e => {
                        const newLabels = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                        setTicket(t => t ? { ...t, labels: newLabels } : t);
                      }}
                      size="small"
                      sx={{ minWidth: 220 }}
                      placeholder="bug, urgent, frontend"
                      helperText="You can enter multiple labels separated by commas."
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 700, height: 40 }}
                      onClick={async () => {
                        const res = await fetch(`/api/admin/tickets/${ticket._id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({ labels: ticket.labels })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          setTicket(data);
                        }
                      }}
                    >
                      Save Labels
                    </Button>
                  </Box>
                ) : (
                  Array.isArray(ticket.labels) && ticket.labels.length > 0 && (
                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      {ticket.labels.map((label: string, idx: number) => (
                        <Box key={idx} sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 13, fontWeight: 600 }}>{label}</Box>
                      ))}
                    </Box>
                  )
                )}
                {/* Description */}
                <Box display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} mb={1} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <Typography variant="subtitle1" sx={{ color: 'var(--muted-foreground)', fontWeight: 700, fontSize: { xs: 15, md: 18 }, minWidth: 100, textAlign: { xs: 'left', sm: 'right' } }}>Description:</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--foreground)', wordBreak: 'break-word', whiteSpace: 'pre-line', fontSize: { xs: 15, md: 18 } }}>{ticket.description}</Typography>
                </Box>
                {/* In-game Nickname */}
                <Box display="flex" alignItems={{ xs: 'flex-start', sm: 'center' }} gap={1.5} mb={1} flexDirection={{ xs: 'column', sm: 'row' }}>
                  <Typography variant="subtitle1" sx={{ color: 'var(--muted-foreground)', fontWeight: 700, fontSize: { xs: 15, md: 18 }, minWidth: 100, textAlign: { xs: 'left', sm: 'right' } }}>In-game Nickname:</Typography>
                  <Typography variant="body1" sx={{ color: 'var(--primary)', fontWeight: 600, fontSize: { xs: 15, md: 18 } }}>{ticket.nickname || '-'}</Typography>
                </Box>
                {Array.isArray(ticket.screenshotUrls) && ticket.screenshotUrls.length > 0 && (
                  <Box display="flex" flexDirection="column" gap={0.5} mt={1}>
                    <Typography variant="subtitle1" sx={{ color: 'var(--muted-foreground)', fontWeight: 700, fontSize: { xs: 14, md: 18 } }}>Screenshots:</Typography>
                    {(ticket.screenshotUrls || []).map((url: string, i: number) => (
                      <Typography key={i} variant="body2" sx={{ color: 'var(--primary)', fontSize: { xs: 12, md: 15 } }}>
                        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Screenshot {(ticket.screenshotUrls && ticket.screenshotUrls.length > 1) ? `#${i + 1}` : ''}</a>
                      </Typography>
                    ))}
                  </Box>
                )}
              </Box>
            </Box>
            {/* Replies */}
            <Box mt={4}>
              <Typography variant="h6" sx={{ color: 'var(--primary)', mb: 1, fontSize: { xs: 15, md: 20 } }}>Replies</Typography>
              <Box>
                {ticket.replies.length === 0 && <Typography sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 12, md: 16 } }}>No replies yet.</Typography>}
                {ticket.replies.map((r, i) => (
                  <Box key={i} mb={2} sx={{ wordBreak: 'break-word', whiteSpace: 'pre-line', bgcolor: 'var(--card)', borderRadius: 1, p: { xs: 1.5, md: 2 }, boxShadow: 1, overflow: 'hidden', position: 'relative' }}>
                    <Typography variant="body2" sx={{ color: 'var(--foreground)', wordBreak: 'break-word', whiteSpace: 'pre-line', fontSize: { xs: 12, md: 16 }, p: 0, m: 0 }}>
                      {r.message}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2} mt={1} flexDirection={{ xs: 'column', md: 'row' }}>
                      <Typography variant="caption" sx={{ color: 'var(--primary)', fontSize: { xs: 11, md: 14 } }}>By: {getUsername(r.user)}{getUserRole(r.user) === 'admin' ? ' (admin)' : ''}</Typography>
                      <Typography variant="caption" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 11, md: 14 } }}>{new Date(r.createdAt).toLocaleString()}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
              {/* Reply Form */}
              {replyStatus && <Alert severity={replyStatus.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>{replyStatus}</Alert>}
              {otherAdminTyping && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {typingAdminNames.length === 1
                    ? `Admin ${typingAdminNames[0]} is currently typing a reply to this ticket.`
                    : `Admins ${typingAdminNames.join(', ')} are currently typing a reply to this ticket.`}
                </Alert>
              )}
              {canReply ? (
                <form onSubmit={async e => {
                  e.preventDefault();
                  setReplyStatus('');
                  try {
                    const res = await fetch(`/api/tickets/${ticket._id}/reply`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      },
                      body: JSON.stringify({ message: replyMsg })
                    });
                    const data = await res.json();
                    if (!res.ok) setReplyStatus(data.message || 'Reply could not be sent.');
                    else {
                      setReplyStatus('Reply sent successfully.');
                      setReplyMsg('');
                      let updatedTicket = data;
                      // If admin/staff/moderator/superadmin replies to an open ticket, set status to in_progress
                      if (
                        isAdmin &&
                        ticket.status === 'open'
                      ) {
                        const patchRes = await fetch(`/api/admin/tickets/${ticket._id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                          },
                          body: JSON.stringify({ status: 'in_progress' })
                        });
                        if (patchRes.ok) {
                          const patchData = await patchRes.json();
                          updatedTicket = patchData;
                        }
                      }
                      setTicket(updatedTicket);
                    }
                  } catch {
                    setReplyStatus('Server error.');
                  }
                }}>
                  <TextField
                    label="Your Reply"
                    value={replyMsg}
                    onChange={handleReplyInput}
                    onBlur={handleReplyBlur}
                    fullWidth
                    required
                    margin="normal"
                    multiline
                    minRows={2}
                    sx={{ fontSize: { xs: 12, md: 16 } }}
                    disabled={otherAdminTyping}
                  />
                  <Button type="submit" variant="contained" disabled={!replyMsg.trim() || otherAdminTyping} sx={{ mt: 1, bgcolor: 'var(--primary)', color: 'var(--primary-foreground)', fontWeight: 700, fontSize: { xs: 13, md: 16 }, width: { xs: '100%', sm: 'auto' }, '&:hover': { bgcolor: 'var(--primary-foreground)', color: 'var(--primary)' } }}>
                    Send Reply
                  </Button>
                </form>
              ) : (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You cannot send a reply until a staff replies.
                </Alert>
              )}
            </Box>
          </>
        )}
        {tab === 1 && (
          <>
            {/* History & Survey */}
            {/* Satisfaction Survey */}
            {canShowSurveyButton && (
              <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => setSurveyModalOpen(true)}>
                Give Satisfaction Survey
              </Button>
            )}
            {ticket.status === 'closed' && ticket.satisfactionSurvey && (
              <Box mt={2}>
                <Typography variant="h6" mb={2}>Satisfaction Survey</Typography>
                <Typography><b>Rating:</b> {ticket.satisfactionSurvey.rating} / 5</Typography>
                <Typography><b>Comment:</b> {ticket.satisfactionSurvey.comment || '-'}</Typography>
                <Typography variant="caption" color="text.secondary">Submitted at: {new Date(ticket.satisfactionSurvey.submittedAt).toLocaleString()}</Typography>
              </Box>
            )}
            {/* Ticket History */}
            <Box mt={4}>
              <Typography variant="h6" mb={2}>Ticket History</Typography>
              <List>
                {logs.length === 0 && <ListItem><ListItemText primary="No history found." /></ListItem>}
                {logs.map(log => (
                  <ListItem key={log._id} alignItems="flex-start">
                    <ListItemText
                      primary={<>
                        <b>{log.action.replace(/_/g, ' ').toUpperCase()}</b> by <span style={{ color: '#3fa7ff' }}>{log.user?.username}</span> ({log.user?.role})
                      </>}
                      secondary={
                        <Typography component="div" variant="body2" color="textSecondary">
                          <div><b>Details:</b> <pre style={{ margin: 0, fontSize: 13, color: '#ccc' }}>{JSON.stringify(log.details, null, 2)}</pre></div>
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            {/* Survey Modal */}
            <Dialog open={surveyModalOpen} onClose={() => setSurveyModalOpen(false)}
              PaperProps={{
                sx: {
                  boxShadow: '0 8px 40px 8px rgba(63,167,255,0.18)',
                  borderRadius: 6,
                  background: '#fff',
                  backdropFilter: 'blur(2px)',
                  border: '1.5px solid #e0e0e0',
                },
                elevation: 24,
              }}
              BackdropProps={{
                sx: {
                  backgroundColor: 'rgba(40,60,100,0.18)',
                  backdropFilter: 'blur(6px)',
                }
              }}
            >
              <DialogTitle>Satisfaction Survey</DialogTitle>
              <DialogContent>
                <Typography mb={2}>How satisfied are you with the resolution?</Typography>
                <Rating
                  name="survey-rating"
                  value={surveyRating}
                  onChange={(_, v) => setSurveyRating(v || 1)}
                  max={5}
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Additional Comments (optional)"
                  value={surveyComment}
                  onChange={e => setSurveyComment(e.target.value)}
                  fullWidth
                  multiline
                  minRows={2}
                  sx={{ mb: 2 }}
                  InputLabelProps={{ sx: { color: '#fff' } }}
                />
                {surveyStatus && <Alert severity={surveyStatus.includes('success') ? 'success' : 'error'} sx={{ mb: 2 }}>{surveyStatus}</Alert>}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setSurveyModalOpen(false)}>Cancel</Button>
                <Button
                  variant="contained"
                  onClick={async () => {
                    if (!ticket) return;
                    setSurveyStatus('');
                    try {
                      const res = await fetch(`/api/tickets/${ticket._id}/survey`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify({ rating: surveyRating, comment: surveyComment })
                      });
                      const data = await res.json();
                      if (!res.ok) setSurveyStatus(data.message || 'Failed to submit survey.');
                      else {
                        setSurveyStatus('Survey submitted successfully.');
                        setSurveyModalOpen(false);
                        setTicket(t => t ? { ...t, satisfactionSurvey: { rating: surveyRating, comment: surveyComment, submittedAt: new Date().toISOString() } } : t);
                      }
                    } catch {
                      setSurveyStatus('Server error.');
                    }
                  }}
                  disabled={surveyRating < 1 || surveyRating > 5}
                >
                  Submit Survey
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default TicketDetail; 