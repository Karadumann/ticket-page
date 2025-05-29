import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';

interface TicketCardProps {
  ticket: {
    _id: string;
    title: string;
    description: string;
    status: string;
    category?: string;
    priority?: string;
    createdAt?: string;
    labels?: string[];
  };
  onClick: (ticket: any) => void;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick }) => {
  return (
    <Card
      sx={{ mb: 2, cursor: 'pointer', bgcolor: 'var(--card)', color: 'var(--foreground)' }}
      onClick={() => onClick(ticket)}
      elevation={3}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={700}>{ticket.title}</Typography>
          <Chip label={ticket.status} color={ticket.status === 'resolved' ? 'success' : ticket.status === 'in_progress' ? 'warning' : 'default'} size="small" />
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 1 }}>
          {ticket.description.length > 80 ? ticket.description.slice(0, 80) + '...' : ticket.description}
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {ticket.category && <Chip label={ticket.category} size="small" />}
          {ticket.priority && <Chip label={ticket.priority} size="small" color={ticket.priority === 'high' || ticket.priority === 'very_high' ? 'error' : 'default'} />}
          {ticket.labels && ticket.labels.map(label => <Chip key={label} label={label} size="small" />)}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {ticket.createdAt && new Date(ticket.createdAt).toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default TicketCard; 