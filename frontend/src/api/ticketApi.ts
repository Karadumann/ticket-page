export const getTickets = async (token: string) => {
  const res = await fetch('/api/tickets', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to fetch tickets.');
  return res.json();
};

export const createTicket = async (data: any, token: string) => {
  const res = await fetch('/api/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error((await res.json()).message || 'Failed to create ticket.');
  return res.json();
}; 