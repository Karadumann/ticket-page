import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Typography, TextField, Button, Paper, Fade } from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import MinimizeIcon from '@mui/icons-material/Minimize';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { jwtDecode } from 'jwt-decode';

interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
  role: string;
}

const AdminChat: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<{ userId: string; username: string; role: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      const userId = decoded.id || decoded._id || decoded.userId || '';
      const username = decoded.username || decoded.email || 'Unknown';
      const role = decoded.role || '';
      console.log('AdminChat user:', { userId, username, role }); // debug
      if (["admin", "superadmin", "staff", "moderator"].includes(role) && userId && username) {
        setIsAdmin(true);
        setUser({ userId, username, role });
        const s: Socket = socketIOClient('http://localhost:5000', { query: { token } });
        setSocket(s);
        s.emit('join-admin-chat', { userId, username, role });
        s.on('admin-chat-history', (msgs: ChatMessage[]) => setMessages(msgs));
        s.on('admin-chat-message', (msg: ChatMessage) => setMessages(prev => [...prev, msg]));
        return () => { s.disconnect(); };
      }
    } catch (e) {
      console.error('JWT decode error:', e);
    }
  }, []);

  useEffect(() => {
    if (open && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, open]);

  if (!isAdmin) return null;

  return (
    <Box sx={{ position: 'fixed', left: 24, bottom: 24, zIndex: 2000 }}>
      {!open && (
        <Fade in={!open}>
          <IconButton onClick={() => setOpen(true)} sx={{ bgcolor: '#1976d2', color: '#fff', boxShadow: 3, '&:hover': { bgcolor: '#1565c0' }, width: 56, height: 56 }}>
            <ChatIcon fontSize="large" />
          </IconButton>
        </Fade>
      )}
      {open && (
        <Fade in={open}>
          <Paper elevation={8} sx={{ width: 340, minHeight: minimized ? 56 : 380, maxHeight: 480, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 3, boxShadow: 6, bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1, borderBottom: '1px solid #e3f2fd', bgcolor: '#1976d2', color: '#fff', borderTopLeftRadius: 12, borderTopRightRadius: 12 }}>
              <Typography fontWeight={700} fontSize={17}>
                {user ? `${user.username} (${user.role})` : 'Admin Chat'}
              </Typography>
              <Box>
                <IconButton size="small" onClick={() => setMinimized(m => !m)} sx={{ color: '#fff' }}>
                  <MinimizeIcon />
                </IconButton>
                <IconButton size="small" onClick={() => setOpen(false)} sx={{ color: '#fff' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </Box>
            {!minimized && (
              <>
                <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1, bgcolor: '#f7fafd', minHeight: 220, maxHeight: 320 }}>
                  {messages.length === 0 && <Typography color="text.secondary" fontSize={14} mt={2}>No messages yet.</Typography>}
                  {messages.map((msg, idx) => (
                    <Box key={idx} mb={1.5} display="flex" flexDirection="column" alignItems={msg.userId === user?.userId ? 'flex-end' : 'flex-start'}>
                      <Box sx={{ bgcolor: msg.userId === user?.userId ? '#1976d2' : '#e3f2fd', color: msg.userId === user?.userId ? '#fff' : '#1976d2', px: 1.5, py: 0.7, borderRadius: 2, fontSize: 14, fontWeight: 500, maxWidth: 220, wordBreak: 'break-word', boxShadow: 1 }}>
                        {msg.message}
                      </Box>
                      <Typography variant="caption" sx={{ color: '#888', fontSize: 11, mt: 0.2, ml: 0.5 }}>
                        {msg.username} ({msg.role}) • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
                <Box sx={{ px: 2, py: 1, borderTop: '1px solid #e3f2fd', bgcolor: '#f7fafd' }}>
                  <form onSubmit={e => {
                    e.preventDefault();
                    if (!input.trim() || !socket) return;
                    socket.emit('admin-chat-message', { message: input });
                    setInput('');
                  }} style={{ display: 'flex', gap: 8 }}>
                    <TextField
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      size="small"
                      placeholder="Type a message..."
                      fullWidth
                      autoFocus
                      sx={{ bgcolor: '#fff', borderRadius: 2 }}
                      inputProps={{ maxLength: 500 }}
                    />
                    <Button type="submit" variant="contained" sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 700, minWidth: 0, px: 2, borderRadius: 2, boxShadow: 1, '&:hover': { bgcolor: '#1565c0' } }}>Send</Button>
                  </form>
                </Box>
              </>
            )}
          </Paper>
        </Fade>
      )}
    </Box>
  );
};

export default AdminChat; 