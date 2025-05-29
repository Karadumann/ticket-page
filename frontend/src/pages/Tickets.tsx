import React, { useEffect, useState } from 'react';
import { Box, Snackbar, ToggleButton, ToggleButtonGroup } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { UserHeader } from '../components/Header';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import TicketForm from '../components/ticket/TicketForm';
import TicketList from '../components/ticket/TicketList';
import { getTickets, createTicket } from '../api/ticketApi';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
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
  labels?: string[];
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
  const [userInfo, setUserInfo] = useState<{ username?: string; avatar?: string }>({});
  const [viewType, setViewType] = useState<'card' | 'list'>('card');

  const fetchTicketsHandler = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token') || '';
      const data = await getTickets(token);
      setTickets(data.tickets);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickets.');
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUserId(decoded.id);
        setUserInfo({ username: decoded.username || decoded.email, avatar: decoded.avatar });
        if (["admin", "superadmin", "staff", "moderator"].includes(decoded.role)) {
          navigate('/admin');
          return;
        }
      } catch {
        // No need to set isAdmin if not an admin
      }
    }
    fetchTicketsHandler();
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
      const token = localStorage.getItem('token') || '';
      await createTicket({ title, description, nickname, screenshotUrls: filteredUrls, category, priority }, token);
      setSuccess('Ticket created!');
      setSnackbar({ open: true, message: 'Ticket created!', severity: 'success' });
      setTitle('');
      setDescription('');
      setNickname('');
      setScreenshotUrls(['']);
      fetchTicketsHandler();
    } catch (err: any) {
      setError(err.message || 'Failed to create ticket.');
      setSnackbar({ open: true, message: err.message || 'Failed to create ticket.', severity: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleTicketClick = (ticket: Ticket) => {
    navigate(`/tickets/${ticket._id}`);
  };

  return (
    <>
      <UserHeader username={userInfo.username} avatar={userInfo.avatar} onLogout={handleLogout} />
      <Box maxWidth={1100} mx="auto" width="100%" minHeight="100vh" position="relative" sx={{ px: { xs: 1, md: 0 }, py: { xs: 2, md: 4 }, bgcolor: 'background.default', display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4, alignItems: 'flex-start', justifyContent: 'center', mt: { xs: 7, sm: 10, md: 13 } }}>
        <Box flex={1} maxWidth={500} width="100%">
          <TicketForm
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            nickname={nickname}
            setNickname={setNickname}
            screenshotUrls={screenshotUrls}
            setScreenshotUrls={setScreenshotUrls}
            category={category}
            setCategory={setCategory}
            priority={priority}
            setPriority={setPriority}
            error={error}
            success={success}
            onSubmit={handleCreate}
          />
        </Box>
        <Box flex={2} width="100%">
          <Box display="flex" alignItems="center" mb={2} gap={2}>
            <ToggleButtonGroup
              value={viewType}
              exclusive
              onChange={(_, v) => v && setViewType(v)}
              size="small"
            >
              <ToggleButton value="card"><ViewModuleIcon /></ToggleButton>
              <ToggleButton value="list"><ViewListIcon /></ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <TicketList tickets={tickets} onTicketClick={handleTicketClick} />
        </Box>
      </Box>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </>
  );
};

export default Tickets; 