import React from 'react';
import { Box, Button, TextField, Typography, Paper, Alert } from '@mui/material';

interface TicketFormProps {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  nickname: string;
  setNickname: (v: string) => void;
  screenshotUrls: string[];
  setScreenshotUrls: (v: string[]) => void;
  category: string;
  setCategory: (v: string) => void;
  priority: string;
  setPriority: (v: string) => void;
  error: string;
  success: string;
  onSubmit: (e: React.FormEvent) => void;
}

const TicketForm: React.FC<TicketFormProps> = ({
  title, setTitle,
  description, setDescription,
  nickname, setNickname,
  screenshotUrls, setScreenshotUrls,
  category, setCategory,
  priority, setPriority,
  error, success,
  onSubmit
}) => {
  return (
    <Paper elevation={4} sx={{ p: { xs: 2, md: 4 }, borderRadius: 2, mb: 2, bgcolor: 'var(--card)', color: 'var(--foreground)', boxShadow: 4, width: '100%' }}>
      <Typography variant="h5" sx={{ color: 'var(--primary)', fontWeight: 800, mb: 2, fontSize: { xs: 20, md: 26 }, letterSpacing: 0.5 }} align="center">
        Create New Ticket
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        {/* Screenshot URL inputları eklenebilir */}
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Create Ticket
        </Button>
      </form>
    </Paper>
  );
};

export default TicketForm; 