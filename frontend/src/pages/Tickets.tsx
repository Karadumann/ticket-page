import React, { useEffect, useState } from 'react';
import { Box, Button, TextField, Typography, Paper, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useNavigate } from 'react-router-dom';

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  replies: { message: string; user: string; createdAt: string }[];
}

const Tickets: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const fetchTickets = async () => {
    setError('');
    try {
      const res = await fetch('/api/tickets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Failed to fetch tickets.');
      else setTickets(data);
    } catch {
      setError('Server error.');
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ title, description })
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Failed to create ticket.');
      else {
        setSuccess('Ticket created!');
        setTitle('');
        setDescription('');
        fetchTickets();
      }
    } catch {
      setError('Server error.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <Box maxWidth={700} mx="auto" width="100%" position="relative">
      <Button onClick={handleLogout} sx={{ position: 'absolute', top: 16, right: 16, minWidth: 0, borderRadius: '50%', p: 1, bgcolor: '#18181c', color: '#ff9100', boxShadow: 2, '&:hover': { bgcolor: '#ff9100', color: '#18181c' } }}>
        <LogoutIcon fontSize="large" />
      </Button>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, mb: 4 }}>
        <Typography variant="h5" color="primary" fontWeight={700} mb={2} align="center">
          Create New Ticket
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <form onSubmit={handleCreate}>
          <TextField
            label="Title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            fullWidth
            required
            margin="normal"
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
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            sx={{ mt: 2 }}
          >
            Create Ticket
          </Button>
        </form>
      </Paper>
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="h5" color="primary" fontWeight={700} mb={2} align="center">
          My Tickets
        </Typography>
        <List>
          {tickets.map(ticket => (
            <React.Fragment key={ticket._id}>
              <ListItem alignItems="flex-start">
                <ListItemText
                  primary={<>
                    <Typography variant="h6" color="primary.main">{ticket.title}</Typography>
                    <Typography variant="body2" color="text.secondary">Status: {ticket.status}</Typography>
                  </>}
                  secondary={<>
                    <Typography variant="body1" color="text.primary">{ticket.description}</Typography>
                    {ticket.replies.length > 0 && (
                      <Box mt={1}>
                        <Typography variant="subtitle2" color="secondary">Replies:</Typography>
                        {ticket.replies.map((r, i) => (
                          <Typography key={i} variant="body2" color="text.secondary">- {r.message}</Typography>
                        ))}
                      </Box>
                    )}
                  </>}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Tickets; 