import React, { useEffect, useState } from 'react';
import axios from 'axios';

function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/tickets', { headers: { Authorization: `Bearer ${token}` } });
      setTickets(res.data);
    } catch (err) {
      setError('Could not fetch tickets');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const token = localStorage.getItem('token');
      await axios.post('/tickets', { category, priority }, { headers: { Authorization: `Bearer ${token}` } });
      setCategory('');
      setPriority('');
      fetchTickets();
    } catch (err) {
      setError('Could not create ticket');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">My Tickets</h1>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleCreate} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Category"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Priority"
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create</button>
      </form>
      <ul className="divide-y">
        {tickets.map(ticket => (
          <li key={ticket.id} className="py-2">
            <div className="font-semibold">{ticket.category} ({ticket.status})</div>
            <div className="text-sm text-gray-600">Priority: {ticket.priority}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TicketsPage; 