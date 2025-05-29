import React from 'react';
import TicketCard from './TicketCard';

interface TicketListProps {
  tickets: any[];
  onTicketClick: (ticket: any) => void;
}

const TicketList: React.FC<TicketListProps> = ({ tickets, onTicketClick }) => {
  if (!tickets.length) return <div>No tickets found.</div>;
  return (
    <div>
      {tickets.map(ticket => (
        <TicketCard key={ticket._id} ticket={ticket} onClick={onTicketClick} />
      ))}
    </div>
  );
};

export default TicketList; 