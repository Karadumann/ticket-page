import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Alert, TextField, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, MenuItem, Select, List, ListItem, ListItemText, Divider, ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import LockResetIcon from '@mui/icons-material/LockReset';
import EditIcon from '@mui/icons-material/Edit';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io as socketIOClient, Socket } from 'socket.io-client';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import NotificationBell from '../components/NotificationBell';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import useMediaQuery from '@mui/material/useMediaQuery';
import Drawer from '@mui/material/Drawer';
import AdminChat from '../components/AdminChat';
import Autocomplete from '@mui/material/Autocomplete';
import Avatar from '@mui/material/Avatar';
import Header from '../components/Header';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import Chip from '@mui/material/Chip';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import ForumIcon from '@mui/icons-material/Forum';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import Menu from '@mui/material/Menu';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

interface User {
  _id: string;
  username: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin' | 'staff' | 'moderator';
  avatar?: string;
}

interface Ticket {
  _id: string;
  title: string;
  description: string;
  status: string;
  user: string;
  replies?: { message: string; user: string; createdAt: string }[];
  nickname?: string;
  screenshotUrls?: string[];
  category: string;
  priority: string;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: User | null;
  labels?: string[];
}

interface DecodedToken {
  role: string;
  [key: string]: any;
}

const getUsername = (userId: string, users: User[] = []) => {
  const user = users.find(u => u._id === userId);
  return user ? user.username : userId;
};

const AdminPanel: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [search, setSearch] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [pwChangeMsg, setPwChangeMsg] = useState('');
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replyMsg, setReplyMsg] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState('user');
  const [editStatus, setEditStatus] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteTicketId, setDeleteTicketId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userPage, setUserPage] = useState(1);
  const [ticketPage, setTicketPage] = useState(1);
  const USERS_PER_PAGE = 20;
  const TICKETS_PER_PAGE = 20;
  const [editTicketDialogOpen, setEditTicketDialogOpen] = useState(false);
  const [editTicketFields, setEditTicketFields] = useState<any>({});
  const [editTicketError, setEditTicketError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTicket, setSearchTicket] = useState('');
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [admins, setAdmins] = useState<User[]>([]);
  const [onlineAdmins, setOnlineAdmins] = useState<User[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');
  const [activeSection, setActiveSection] = useState<'dashboard' | 'users' | 'tickets' | 'logs'>(() => {
    if (location.pathname.startsWith('/dashboard') || location.pathname === '/') return 'dashboard';
    if (location.pathname.startsWith('/admin')) {
      const params = new URLSearchParams(location.search);
      const section = params.get('section');
      if (section === 'users' || section === 'tickets' || section === 'logs') return section;
      return 'tickets';
    }
    return 'dashboard';
  });
  const [userId, setUserId] = useState<string>('');
  const [labelFilter, setLabelFilter] = useState<string[]>([]);
  const [assignedToFilter, setAssignedToFilter] = useState<string>('');
  const [hasNewTickets, setHasNewTickets] = useState(false);
  const [newTicketCount, setNewTicketCount] = useState(0);
  const [viewType, setViewType] = useState<'kanban' | 'list'>('kanban');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [filterType, setFilterType] = useState<'category' | 'priority' | 'status' | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserId('');
      return;
    }
    try {
      const decoded = jwtDecode<DecodedToken>(token);
      setIsAdmin(decoded.role === 'admin' || decoded.role === 'superadmin' || decoded.role === 'staff' || decoded.role === 'moderator');
      setIsSuperAdmin(decoded.role === 'superadmin');
      setUserId(decoded.id || decoded._id || '');
    } catch {
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserId('');
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setError('');
      try {
        const [usersRes, ticketsRes] = await Promise.all([
          fetch(`/api/admin/users?page=${userPage}&limit=${USERS_PER_PAGE}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } }),
          fetch(`/api/admin/tickets?page=${ticketPage}&limit=${TICKETS_PER_PAGE}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } })
        ]);
        const usersData = await usersRes.json();
        const ticketsData = await ticketsRes.json();
        if (!usersRes.ok) setError(usersData.message || 'Failed to fetch users.');
        else {
          setUsers(usersData.users);
          setTotalUsers(usersData.total);
        }
        if (!ticketsRes.ok) setError(ticketsData.message || 'Failed to fetch tickets.');
        else {
          setTickets(ticketsData.tickets);
          setTotalTickets(ticketsData.total);
        }
      } catch {
        setError('Server error.');
      }
    };
    fetchData();
  }, [isAdmin, userPage, ticketPage]);

  useEffect(() => {
    const fetchOnlineAdmins = async () => {
      try {
        const res = await fetch('/api/admin/online-admins', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setOnlineAdmins(data.admins || []);
      } catch {}
    };
    fetchOnlineAdmins();
    const interval = setInterval(fetchOnlineAdmins, 10000); // 10 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    // Token'ı query parametre olarak gönder
    const socket: Socket = socketIOClient('http://localhost:5000', {
      query: { token }
    });
    // Bağlantı açık kalsın, gerekirse bir state'te tutabilirsin
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleOpenDialog = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
    setNewPassword('');
    setPwChangeMsg('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setNewPassword('');
    setPwChangeMsg('');
  };

  const handleChangePassword = async () => {
    if (!selectedUser) return;
    setPwChangeMsg('');
    try {
      const res = await fetch(`/api/admin/users/${selectedUser._id}/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setPwChangeMsg(data.message || 'Password could not be changed.');
        toast.error(data.message || 'Password could not be changed.');
      } else {
        setPwChangeMsg('Password changed successfully.');
        toast.success('Password changed successfully.');
      }
    } catch {
      setPwChangeMsg('Server error.');
      toast.error('Server error.');
    }
  };

  const handleCloseReplyDialog = () => {
    setReplyDialogOpen(false);
    setSelectedTicket(null);
    setReplyMsg('');
    setReplyStatus('');
  };

  const handleSendReply = async () => {
    if (!selectedTicket) return;
    setReplyStatus('');
    try {
      const res = await fetch(`/api/tickets/${selectedTicket._id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ message: replyMsg })
      });
      const data = await res.json();
      if (!res.ok) {
        setReplyStatus(data.message || 'Reply could not be sent.');
        toast.error(data.message || 'Reply could not be sent.');
      } else {
        setReplyStatus('Reply sent successfully.');
        toast.success('Reply sent successfully.');
        setReplyMsg('');
        setTickets(tickets => tickets.map(t => t._id === selectedTicket._id ? data : t));
      }
    } catch {
      setReplyStatus('Server error.');
      toast.error('Server error.');
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setTickets(tickets => tickets.filter(t => t._id !== ticketId));
        setDeleteTicketId(null);
        toast.success('Ticket deleted.');
      }
    } catch {
      toast.error('Ticket deletion failed.');
    }
  };

  const handleOpenEditDialog = (user: User) => {
    setEditUser(user);
    setEditUsername(user.username);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDialogOpen(true);
    setEditStatus('');
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditUser(null);
    setEditStatus('');
  };

  const handleEditUser = async () => {
    if (!editUser) return;
    setEditStatus('');
    try {
      const res = await fetch(`/api/admin/users/${editUser._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ username: editUsername, email: editEmail, role: editRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setEditStatus(data.message || 'Could not update.');
        toast.error(data.message || 'Could not update.');
      } else {
        setEditStatus('Successfully updated.');
        toast.success('User updated successfully.');
        setUsers(users => users.map(u => u._id === editUser._id ? data : u));
      }
    } catch {
      setEditStatus('Server error.');
      toast.error('Server error.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setUsers(users => users.filter(u => u._id !== userId));
        setDeleteUserId(null);
        toast.success('User deleted.');
      }
    } catch {
      toast.error('User deletion failed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const openCount = tickets.filter(t => t.status === 'open').length;

  useEffect(() => {
    if (!isAdmin) return;
    const socket: Socket = socketIOClient('http://localhost:5000');
    socket.on('new-ticket', (ticket: Ticket) => {
      setTickets(prev => [ticket, ...prev]);
      setTotalTickets(prev => prev + 1);
      setHasNewTickets(true);
      setNewTicketCount(prev => prev + 1);
      toast.info('A new ticket has arrived!');
    });
    return () => {
      socket.disconnect();
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchTickets = async () => {
      setError('');
      try {
        const params = new URLSearchParams();
        params.append('page', ticketPage.toString());
        params.append('limit', TICKETS_PER_PAGE.toString());
        if (categoryFilter) params.append('category', categoryFilter);
        if (priorityFilter) params.append('priority', priorityFilter);
        if (statusFilter) params.append('status', statusFilter);
        if (searchTicket) params.append('search', searchTicket);
        if (fromDate) params.append('from', fromDate.toISOString());
        if (toDate) params.append('to', toDate.toISOString());
        if (labelFilter.length > 0) labelFilter.forEach(l => params.append('labels', l));
        if (assignedToFilter) params.append('assignedTo', assignedToFilter);
        const ticketsRes = await fetch(`/api/admin/tickets?${params.toString()}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
        const ticketsData = await ticketsRes.json();
        if (!ticketsRes.ok) setError(ticketsData.message || 'Failed to fetch tickets.');
        else {
          setTickets(ticketsData.tickets);
          setTotalTickets(ticketsData.total);
        }
      } catch {
        setError('Server error.');
      }
    };
    fetchTickets();
  }, [isAdmin, ticketPage, categoryFilter, priorityFilter, statusFilter, searchTicket, fromDate, toDate, labelFilter, assignedToFilter]);

  useEffect(() => {
    if (!isAdmin) return;
    const fetchAdmins = async () => {
      const res = await fetch('/api/admin/users?page=1&limit=100', { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const data = await res.json();
      setAdmins((data.users || []).filter((u: User) => ['admin', 'superadmin', 'moderator', 'staff'].includes(u.role)));
    };
    fetchAdmins();
  }, [isAdmin]);

  const columns = [
    { key: 'open', label: 'Open' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ];
  const ticketsByStatus = columns.reduce((acc, col) => {
    acc[col.key] = tickets.filter(ticket => ticket.status === col.key &&
      (categoryFilter === '' || ticket.category === categoryFilter) &&
      (priorityFilter === '' || ticket.priority === priorityFilter)
    );
    return acc;
  }, {} as Record<string, Ticket[]>);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor));

  function TicketCard({ ticket, colKey }: { ticket: Ticket, colKey: string }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: ticket._id,
      data: { colKey },
    });
    const handleClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).tagName === 'A') return;
      if (!dragging) navigate(`/tickets/${ticket._id}`);
    };
    const globalIndex = tickets.findIndex(t => t._id === ticket._id);
    return (
      <div
        ref={setNodeRef}
        style={{
          width: '100%',
          maxWidth: 380,
          margin: '0 auto 8px auto',
          padding: 16,
          borderRadius: 8,
          background: isDragging ? '#e3f2fd' : '#fff',
          boxShadow: isDragging ? '0 4px 16px rgba(63,167,255,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
          opacity: isDragging ? 0.8 : 1,
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
          transform: CSS.Transform.toString(transform),
          transition,
        }}
        onClick={handleClick}
      >
        {/* Drag Handle ve Priority */}
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <div
            {...attributes}
            {...listeners}
            style={{
              position: 'relative',
              cursor: 'grab',
              zIndex: 3,
              color: '#1976d2',
              background: '#e3f2fd',
              border: '2px solid #1976d2',
              borderRadius: 8,
              padding: 4,
              boxShadow: '0 2px 8px rgba(25,118,210,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Drag to move"
          >
            <OpenWithIcon fontSize="small" />
          </div>
          {/* Priority label */}
          {(() => {
            let priorityLabel = '';
            let priorityBg = '';
            let priorityColor = '';
            switch (ticket.priority) {
              case 'very_high':
                priorityLabel = 'Very High';
                priorityBg = '#ff1744';
                priorityColor = '#fff';
                break;
              case 'high':
                priorityLabel = 'High';
                priorityBg = '#ff9100';
                priorityColor = '#fff';
                break;
              case 'medium':
                priorityLabel = 'Medium';
                priorityBg = '#2979ff';
                priorityColor = '#fff';
                break;
              case 'low':
                priorityLabel = 'Low';
                priorityBg = '#00e676';
                priorityColor = '#222';
                break;
              default:
                priorityLabel = ticket.priority || '-';
                priorityBg = '#e3f2fd';
                priorityColor = '#222';
            }
            return (
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: { xs: 12, md: 14 }, px: 1.5, py: 0.5, borderRadius: 1, bgcolor: priorityBg, color: priorityColor, letterSpacing: 0.5 }}>
                <b>Priority:</b> {priorityLabel}
              </Typography>
            );
          })()}
          {/* Labels (chipler) */}
          {Array.isArray(ticket.labels) && ticket.labels.length > 0 && (
            <Box display="flex" gap={0.5} flexWrap="wrap" ml={1}>
              {ticket.labels.map((label: string, idx: number) => (
                <Box key={idx} sx={{ bgcolor: '#e3f2fd', color: '#1976d2', px: 1, py: 0.2, borderRadius: 2, fontSize: 11, fontWeight: 600, lineHeight: 1.2 }}>{label}</Box>
              ))}
            </Box>
          )}
        </Box>
        {/* Sağ üstte #id badge'i */}
        <Box position="absolute" top={8} right={8} zIndex={2}>
          <Typography variant="caption" sx={{ bgcolor: '#23232b', color: '#fff', px: 1.5, py: 0.5, borderRadius: 2, fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>
            #{globalIndex + 1}
          </Typography>
        </Box>
        {/* Column adı biraz aşağıda */}
        <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" mb={1} mt={3}>
          <Typography variant="h6" sx={{ color: 'var(--primary)', fontWeight: 700, fontSize: { xs: 15, md: 18 }, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: { xs: 180, md: 350 } }}>{ticket.title}</Typography>
          <Typography variant="caption" sx={{ color: '#bdbdbd', fontWeight: 700, fontSize: { xs: 12, md: 14 }, borderRadius: 2, px: 1.5, py: 0.5, ml: 2, textTransform: 'capitalize', mt: 2 }}>{columns.find(c => c.key === colKey)?.label}</Typography>
        </Box>
        {ticket.assignedTo && (
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={ticket.assignedTo.avatar} sx={{ width: 28, height: 28, bgcolor: '#3fa7ff', fontSize: 15 }}>
              {(!ticket.assignedTo.avatar) ? ticket.assignedTo.username[0]?.toUpperCase() : ''}
            </Avatar>
            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 600, fontSize: { xs: 12, md: 14 }, px: 1, py: 0.5, borderRadius: 1, bgcolor: '#3fa7ff' }}>
              <b>Assigned:</b> {ticket.assignedTo.username}
            </Typography>
          </Box>
        )}
        <Typography
          variant="body2"
          sx={{
            color: 'var(--foreground)',
            fontSize: { xs: 13, md: 15 },
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical',
            maxWidth: '100%'
          }}
        >
          <b>Description:</b> {ticket.description}
        </Typography>
        {(ticket.screenshotUrls?.length ?? 0) > 0 && (
          <Box mb={1} display="flex" flexDirection="column" gap={0.5}>
            {ticket.screenshotUrls?.map((url, i) => (
              <Typography key={i} variant="body2" sx={{ color: 'var(--primary)', fontSize: { xs: 12, md: 14 } }}>
                <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Screenshot {ticket.screenshotUrls && ticket.screenshotUrls.length > 1 ? `#${i + 1}` : ''}</a>
              </Typography>
            ))}
          </Box>
        )}
        <Box display="flex" gap={2} flexWrap="wrap" mb={1} alignItems="center">
          <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 12, md: 14 } }}><b>Replies:</b> {ticket.replies?.length || 0}</Typography>
          <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 12, md: 14 } }}><b>Created:</b> {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '-'}</Typography>
          <Typography variant="body2" sx={{ color: 'var(--muted-foreground)', fontSize: { xs: 12, md: 14 } }}><b>Updated:</b> {ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString() : '-'}</Typography>
        </Box>
        <Box display="flex" justifyContent="flex-end" mt={1}>
          <a
            href={`/tickets/${ticket._id}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: 'none',
              color: '#1976d2',
              fontWeight: 700,
              fontSize: 15,
              padding: '6px 16px',
              border: '1px solid #1976d2',
              borderRadius: 4,
              background: '#e3f2fd',
              display: 'inline-block',
              transition: 'background 0.2s',
            }}
          >
            View Detail
          </a>
        </Box>
      </div>
    );
  }

  function handleDragStart() {
    setDragging(true);
  }

  function handleDragEnd(event: any) {
    setDragging(false);
    const { active, over } = event;
    if (!over || !active) return;
    if (active.id === over.id) return;

    let toCol = columns.find(col => col.key === over.id)?.key;
    if (!toCol) {
      const overTicket = tickets.find(t => t._id === over.id);
      toCol = overTicket?.status;
    }
    const fromTicket = tickets.find(t => t._id === active.id);
    const fromCol = fromTicket?.status;

    if (fromCol && toCol && fromCol !== toCol) {
      fetch(`/api/admin/tickets/${active.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: toCol })
      }).then(res => res.json()).then(data => {
        if (data && !data.error) {
          setTickets(tickets => tickets.map(t => t._id === active.id ? { ...t, status: toCol } : t));
        }
      });
    }
    setActiveTicketId(null);
  }

  function TicketColumn({ col, tickets, children }: { col: { key: string, label: string }, tickets: Ticket[], children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: col.key });
    return (
      <div
        ref={setNodeRef}
        style={{ minHeight: 200, flex: 1, minWidth: 340, maxWidth: 480, background: isOver ? '#e3f2fd' : '#f7fafc', margin: 8, borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', transition: 'background 0.2s' }}
        id={col.key}
      >
        <Typography variant="subtitle1" fontWeight={700} align="center" mb={2} sx={{ color: 'var(--primary)', fontSize: { xs: 17, md: 20 } }}>{col.label}</Typography>
        {tickets.length === 0 && (
          <Typography color="text.secondary" align="center" sx={{ fontSize: { xs: 14, md: 16 } }}>No tickets</Typography>
        )}
        {children}
      </div>
    );
  }

  const handleSectionChange = (section: 'dashboard' | 'users' | 'tickets' | 'logs') => {
    setActiveSection(section);
    if (section === 'dashboard') navigate('/dashboard');
    else if (section === 'users') navigate('/admin?section=users');
    else if (section === 'tickets') navigate('/admin?section=tickets');
    else if (section === 'logs') navigate('/admin?section=logs');
  };

  useEffect(() => {
    if (location.pathname.startsWith('/admin')) {
      const params = new URLSearchParams(location.search);
      const section = params.get('section');
      if (section === 'users' || section === 'tickets' || section === 'logs') {
        setActiveSection(section);
      } else {
        setActiveSection('tickets');
      }
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (location.pathname.startsWith('/admin') && activeSection === 'tickets') {
      refreshTickets();
    }
    // eslint-disable-next-line
  }, [location.pathname, activeSection]);

  // Profil güncelleme sonrası ticket listesini güncellemek için fonksiyon
  const refreshTickets = async () => {
    try {
      const params = new URLSearchParams();
      params.append('page', ticketPage.toString());
      params.append('limit', TICKETS_PER_PAGE.toString());
      if (categoryFilter) params.append('category', categoryFilter);
      if (priorityFilter) params.append('priority', priorityFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (searchTicket) params.append('search', searchTicket);
      if (fromDate) params.append('from', fromDate.toISOString());
      if (toDate) params.append('to', toDate.toISOString());
      if (labelFilter.length > 0) labelFilter.forEach(l => params.append('labels', l));
      if (assignedToFilter) params.append('assignedTo', assignedToFilter);
      const ticketsRes = await fetch(`/api/admin/tickets?${params.toString()}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      const ticketsData = await ticketsRes.json();
      if (ticketsRes.ok) {
        setTickets(ticketsData.tickets);
        setTotalTickets(ticketsData.total);
      }
    } catch {}
  };

  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>, type: 'category' | 'priority' | 'status') => {
    setAnchorEl(event.currentTarget);
    setFilterType(type);
  };
  const handleFilterMenuClose = () => {
    setAnchorEl(null);
    setFilterType(null);
  };
  const handleFilterSelect = (type: 'category' | 'priority' | 'status', value: string) => {
    if (type === 'category') setCategoryFilter(value);
    if (type === 'priority') setPriorityFilter(value);
    if (type === 'status') setStatusFilter(value);
    handleFilterMenuClose();
  };

  if (!isAdmin) {
    return <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh"><Alert severity="error">Unauthorized. Only admins can access this page.</Alert></Box>;
  }

  return (
    <>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
      {/* Mobilde hamburger ve Drawer */}
      {isMobile ? (
        <>
          <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" sx={{ position: 'fixed', top: 0, left: 0, zIndex: 1400, bgcolor: 'var(--sidebar)', px: 2, py: 1, boxShadow: 2 }}>
            <IconButton onClick={() => setSidebarOpen(true)}>
              <MenuIcon sx={{ color: 'var(--primary)', fontSize: 32 }} />
            </IconButton>
            <Box display="flex" alignItems="center" gap={2}>
              {isAdmin && <NotificationBell userId={userId} sx={{ color: '#23232b', '&:hover': { bgcolor: '#e3f2fd' } }} />}
              {/* Logout button removed from here */}
            </Box>
          </Box>
          <Drawer anchor="left" open={sidebarOpen} onClose={() => setSidebarOpen(false)}>
            <Box width={220} role="presentation" onClick={() => setSidebarOpen(false)} onKeyDown={() => setSidebarOpen(false)} sx={{ mt: 2 }}>
              <Typography variant="h6" fontWeight={700} color="var(--primary)" sx={{ mb: 2, ml: 2 }}>Admin Menu</Typography>
              <Button fullWidth sx={{ justifyContent: 'flex-start', pl: 2, py: 1, fontWeight: 700, color: activeSection === 'dashboard' ? 'var(--primary)' : 'inherit' }} onClick={() => handleSectionChange('dashboard')}>Dashboard</Button>
              <Button fullWidth sx={{ justifyContent: 'flex-start', pl: 2, py: 1, fontWeight: 700, color: activeSection === 'users' ? 'var(--primary)' : 'inherit' }} onClick={() => handleSectionChange('users')}>Users</Button>
              <Button fullWidth sx={{ justifyContent: 'flex-start', pl: 2, py: 1, fontWeight: 700, color: activeSection === 'tickets' ? 'var(--primary)' : 'inherit' }} onClick={() => handleSectionChange('tickets')}>Tickets</Button>
              {isSuperAdmin && <Button fullWidth sx={{ justifyContent: 'flex-start', pl: 2, py: 1, fontWeight: 700, color: activeSection === 'logs' ? 'var(--primary)' : 'inherit' }} onClick={() => handleSectionChange('logs')}>Logs</Button>}
            </Box>
          </Drawer>
          <Box sx={{ pt: 8 }} />
        </>
      ) : (
        <Header activeSection={activeSection} onSectionChange={handleSectionChange} isAdmin onLogout={handleLogout} userId={userId} />
      )}
      {/* Main Content */}
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: 'var(--background)',
          px: { xs: 0, sm: 2, md: 4, lg: 6, xl: 10, '2xl': 16, '4xl': 32, '8xl': 64, '16xl': 128 },
          py: { xs: 2, md: 4, lg: 6, xl: 8, '2xl': 12, '4xl': 20, '8xl': 32, '16xl': 64 },
          pt: { xs: 56, md: 72 },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          width: '100%',
          maxWidth: {
            xs: '100%',
            sm: 800,
            md: 1200,
            lg: 1600,
            xl: 1920,
            '2xl': 2560,
            '4xl': 3840,
            '8xl': 7680,
            '16xl': 15360
          },
          mx: 'auto',
          transition: 'background 0.3s',
        }}
      >
        {/* Notification Bell ve Logout aynı hizada */}
        {/* NotificationBell removed from here, now only in Header */}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {onlineAdmins.length > 0 && (
          <Box display="flex" alignItems="center" gap={2} mb={2} sx={{ bgcolor: '#e8f5e9', borderRadius: 2, px: 2, py: 1, minHeight: 48 }}>
            <Typography variant="subtitle1" sx={{ color: '#388e3c', fontWeight: 700, mr: 1 }}>Online Admins:</Typography>
            {onlineAdmins.map(admin => (
              <Box key={admin._id} display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 10, height: 10, bgcolor: '#43a047', borderRadius: '50%', mr: 0.5 }} />
                <Typography variant="body2" sx={{ color: '#222', fontWeight: 600 }}>{admin.username}</Typography>
              </Box>
            ))}
          </Box>
        )}
        {/* Responsive kartlar ve kolonlar */}
        <Box display="flex" justifyContent="center" alignItems="flex-start" gap={{ xs: 2, sm: 3, md: 4, xl: 6 }} mb={4} mt={2} flexWrap="nowrap" width="100%">
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3, xl: 4, '2xl': 6, '4xl': 8, '8xl': 12, '16xl': 24 }, minWidth: 120, maxWidth: { xs: '100%', sm: 220, md: 260, xl: 320, '2xl': 400, '4xl': 600, '8xl': 900, '16xl': 1800 }, textAlign: 'center', bgcolor: '#e3f2fd', flex: '1 1 160px', m: 0.5 }}>
            <Typography variant="subtitle2" color="primary">Total</Typography>
            <Typography variant="h5" fontWeight={700}>{totalTickets}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3, xl: 4, '2xl': 6, '4xl': 8, '8xl': 12, '16xl': 24 }, minWidth: 120, maxWidth: { xs: '100%', sm: 220, md: 260, xl: 320, '2xl': 400, '4xl': 600, '8xl': 900, '16xl': 1800 }, textAlign: 'center', bgcolor: '#fffde7', flex: '1 1 160px', m: 0.5 }}>
            <Typography variant="subtitle2" color="primary">Open</Typography>
            <Typography variant="h5" fontWeight={700}>{openCount}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3, xl: 4, '2xl': 6, '4xl': 8, '8xl': 12, '16xl': 24 }, minWidth: 120, maxWidth: { xs: '100%', sm: 220, md: 260, xl: 320, '2xl': 400, '4xl': 600, '8xl': 900, '16xl': 1800 }, textAlign: 'center', bgcolor: '#e0f7fa', flex: '1 1 160px', m: 0.5 }}>
            <Typography variant="subtitle2" color="primary">In Progress</Typography>
            <Typography variant="h5" fontWeight={700}>{tickets.filter(t => t.status === 'in_progress').length}</Typography>
          </Paper>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 2.5, md: 3, xl: 4, '2xl': 6, '4xl': 8, '8xl': 12, '16xl': 24 }, minWidth: 120, maxWidth: { xs: '100%', sm: 220, md: 260, xl: 320, '2xl': 400, '4xl': 600, '8xl': 900, '16xl': 1800 }, textAlign: 'center', bgcolor: '#e3ffe3', flex: '1 1 160px', m: 0.5 }}>
            <Typography variant="subtitle2" color="primary">Resolved</Typography>
            <Typography variant="h5" fontWeight={700}>{tickets.filter(t => t.status === 'resolved').length}</Typography>
          </Paper>
        </Box>
        {activeSection === 'users' && (
          <>
            <Typography variant="subtitle1" color="primary" mb={1} align="center">
              Total Users: {totalUsers}
            </Typography>
            <Paper elevation={4} sx={{ p: { xs: 1, md: 5 }, borderRadius: 4, mb: 4, width: { xs: '99%', sm: '98%', md: '95%' }, mx: 'auto', bgcolor: 'var(--sidebar)', color: 'var(--sidebar-foreground)', boxShadow: 6 }}>
              <Typography variant="h6" sx={{ color: 'var(--primary)', mb: 2, fontSize: { xs: 18, md: 22 } }}>Users</Typography>
              <TextField
                label="Search User"
                value={search}
                onChange={e => setSearch(e.target.value)}
                fullWidth
                margin="normal"
                sx={{ mb: 2, fontSize: { xs: 14, md: 16 } }}
              />
              <List>
                {users
                  .filter(user =>
                    user.username.toLowerCase().includes(search.toLowerCase()) ||
                    user.email.toLowerCase().includes(search.toLowerCase())
                  )
                  .map(user => (
                    <React.Fragment key={user._id}>
                      <ListItem
                        secondaryAction={isSuperAdmin && (
                          <>
                            <IconButton edge="end" aria-label="Edit" onClick={() => handleOpenEditDialog(user)} size="small">
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" aria-label="Delete" onClick={() => setDeleteUserId(user._id)} sx={{ ml: 1 }} size="small">
                              <PersonRemoveIcon fontSize="small" />
                            </IconButton>
                            <IconButton edge="end" aria-label="Change Password" onClick={() => handleOpenDialog(user)} sx={{ ml: 1 }} size="small">
                              <LockResetIcon fontSize="small" />
                            </IconButton>
                          </>
                        )}
                        sx={{ flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, py: { xs: 1, md: 2 } }}
                      >
                        <Avatar src={user.avatar} sx={{ width: 36, height: 36, mr: 2, bgcolor: '#1976d2' }}>
                          {(!user.avatar) ? user.username[0]?.toUpperCase() : ''}
                        </Avatar>
                        <ListItemText primary={<span style={{ fontSize: 16 }}>{user.username} ({user.email})</span>} secondary={<span style={{ fontSize: 13 }}>Role: {user.role}</span>} />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))}
              </List>
              <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={2}>
                <Button variant="outlined" onClick={() => setUserPage(p => Math.max(1, p - 1))} disabled={userPage === 1}>Previous</Button>
                <Typography>Page {userPage} / {Math.ceil(totalUsers / USERS_PER_PAGE)}</Typography>
                <Button variant="outlined" onClick={() => setUserPage(p => p + 1)} disabled={userPage >= Math.ceil(totalUsers / USERS_PER_PAGE)}>Next</Button>
              </Box>
            </Paper>
          </>
        )}
        {activeSection === 'tickets' && (
          <>
            <Typography variant="subtitle1" color="primary" mb={1} align="center">
              Total Tickets: {totalTickets}
            </Typography>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" sx={{ color: 'var(--primary)', mb: 2, fontSize: { xs: 18, md: 22 } }}></Typography>
              <ToggleButtonGroup
                value={viewType}
                exclusive
                onChange={(_, next) => next && setViewType(next)}
                size="small"
                sx={{ ml: 2 }}
              >
                <ToggleButton value="kanban" aria-label="Kanban View"><ViewModuleIcon /></ToggleButton>
                <ToggleButton value="list" aria-label="List View"><ViewListIcon /></ToggleButton>
              </ToggleButtonGroup>
            </Box>
            {viewType === 'kanban' ? (
              <Paper elevation={4} sx={{ p: { xs: 1, md: 5 }, borderRadius: 4, width: { xs: '99%', sm: '98%', md: '95%' }, mx: 'auto', bgcolor: 'var(--sidebar)', color: 'var(--sidebar-foreground)', boxShadow: 6 }}>
                <Typography variant="h6" sx={{ color: 'var(--primary)', mb: 2, fontSize: { xs: 18, md: 22 } }}>Tickets</Typography>
                <Box mb={1} display="flex" gap={2} flexWrap="wrap">
                  <TextField
                    select
                    label="Category Filter"
                    value={categoryFilter}
                    onChange={e => setCategoryFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 160, flex: '0 0 auto', height: 40, mb: 0 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="bug">Bug</MenuItem>
                    <MenuItem value="payment">Payment</MenuItem>
                    <MenuItem value="account">Account</MenuItem>
                    <MenuItem value="suggestion">Suggestion</MenuItem>
                    <MenuItem value="report_player">Report Player</MenuItem>
                    <MenuItem value="technical">Technical</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Priority Filter"
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 160, flex: '0 0 auto', height: 40, mb: 0 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="very_high">Very High</MenuItem>
                  </TextField>
                  <TextField
                    select
                    label="Status Filter"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 160, flex: '0 0 auto', height: 40, mb: 0 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="open">Open</MenuItem>
                    <MenuItem value="in_progress">In Progress</MenuItem>
                    <MenuItem value="resolved">Resolved</MenuItem>
                  </TextField>
                  <Autocomplete
                    multiple
                    options={Array.from(new Set(tickets.flatMap(t => t.labels || [])))}
                    value={labelFilter}
                    onChange={(_, v) => setLabelFilter(v)}
                    renderInput={params => <TextField {...params} label="Label Filter" sx={{ minWidth: 160, flex: '0 0 auto', height: 40, mb: 0 }} size="small" />}
                    size="small"
                    sx={{ minWidth: 160, flex: '0 0 auto', height: 40, mb: 0 }}
                  />
                </Box>
                <Box mb={3} display="flex" gap={2} flexWrap="wrap">
                  <TextField
                    select
                    label="Assigned Admin"
                    value={assignedToFilter}
                    onChange={e => setAssignedToFilter(e.target.value)}
                    size="small"
                    sx={{ minWidth: 160, flex: '0 0 auto', height: 40, mb: 0 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    {admins.map(a => (
                      <MenuItem key={a._id} value={a._id}>{a.username}</MenuItem>
                    ))}
                  </TextField>
                  <DatePicker
                    label="From Date"
                    value={fromDate}
                    onChange={setFromDate}
                    slotProps={{ textField: { size: 'small', sx: { minWidth: 140, flex: '0 0 auto', height: 40, mb: 0 } } }}
                  />
                  <DatePicker
                    label="To Date"
                    value={toDate}
                    onChange={setToDate}
                    slotProps={{ textField: { size: 'small', sx: { minWidth: 140, flex: '0 0 auto', height: 40, mb: 0 } } }}
                  />
                  <TextField
                    label="Search Ticket"
                    value={searchTicket}
                    onChange={e => setSearchTicket(e.target.value)}
                    size="small"
                    sx={{ minWidth: 200, flex: '0 0 auto', height: 40, mb: 0 }}
                  />
                </Box>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
                  <Box
                    display="flex"
                    gap={2}
                    flexDirection={{ xs: 'column', sm: 'row' }}
                    sx={{
                      overflowX: { xs: 'visible', sm: 'auto' },
                      width: '100%',
                      minHeight: 400,
                      pb: 2,
                      flexWrap: 'nowrap',
                      minWidth: 0,
                      '&::-webkit-scrollbar': { height: 8 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: '#e3f2fd', borderRadius: 4 },
                    }}
                  >
                    {columns.map(col => (
                      <TicketColumn key={col.key} col={col} tickets={ticketsByStatus[col.key]}>
                        <SortableContext items={ticketsByStatus[col.key].map(t => t._id)} strategy={verticalListSortingStrategy}>
                          {ticketsByStatus[col.key].map(ticket => (
                            <TicketCard key={ticket._id} ticket={ticket} colKey={col.key} />
                          ))}
                        </SortableContext>
                      </TicketColumn>
                    ))}
                  </Box>
                  <DragOverlay>
                    {activeTicketId ? (
                      (() => {
                        const ticket = tickets.find(t => t._id === activeTicketId);
                        return ticket ? <TicketCard ticket={ticket} colKey={ticket.status} /> : null;
                      })()
                    ) : null}
                  </DragOverlay>
                </DndContext>
                <Box display="flex" justifyContent="center" alignItems="center" mt={2} gap={2}>
                  <Button variant="outlined" onClick={() => setTicketPage(p => Math.max(1, p - 1))} disabled={ticketPage === 1}>Previous</Button>
                  <Typography>Page {ticketPage} / {Math.ceil(totalTickets / TICKETS_PER_PAGE)}</Typography>
                  <Button variant="outlined" onClick={() => setTicketPage(p => p + 1)} disabled={ticketPage >= Math.ceil(totalTickets / TICKETS_PER_PAGE)}>Next</Button>
                </Box>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ boxShadow: 4, borderRadius: 3, mt: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f7fa' }}>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, cursor: 'pointer', position: 'relative' }} onClick={e => handleFilterMenuOpen(e, 'category')}>
                        Category <ArrowDropDownIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
                        {categoryFilter && <Chip label={categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1).replace('_', ' ')} size="small" onDelete={() => setCategoryFilter('')} sx={{ ml: 1, bgcolor: '#e3f2fd', color: '#1976d2' }} />}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, cursor: 'pointer', position: 'relative' }} onClick={e => handleFilterMenuOpen(e, 'priority')}>
                        Priority <ArrowDropDownIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
                        {priorityFilter && <Chip label={priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1).replace('_', ' ')} size="small" onDelete={() => setPriorityFilter('')} sx={{ ml: 1, bgcolor: '#e3f2fd', color: '#1976d2' }} />}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16, cursor: 'pointer', position: 'relative' }} onClick={e => handleFilterMenuOpen(e, 'status')}>
                        Status <ArrowDropDownIcon fontSize="small" sx={{ verticalAlign: 'middle' }} />
                        {statusFilter && <Chip label={statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')} size="small" onDelete={() => setStatusFilter('')} sx={{ ml: 1, bgcolor: '#e3f2fd', color: '#1976d2' }} />}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Assigned</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Created</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Replies</TableCell>
                    </TableRow>
                  </TableHead>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleFilterMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                  >
                    {filterType === 'category' && [
                      <MenuItem key="all" selected={categoryFilter === ''} onClick={() => handleFilterSelect('category', '')}>All</MenuItem>,
                      <MenuItem key="bug" selected={categoryFilter === 'bug'} onClick={() => handleFilterSelect('category', 'bug')}>Bug</MenuItem>,
                      <MenuItem key="payment" selected={categoryFilter === 'payment'} onClick={() => handleFilterSelect('category', 'payment')}>Payment</MenuItem>,
                      <MenuItem key="account" selected={categoryFilter === 'account'} onClick={() => handleFilterSelect('category', 'account')}>Account</MenuItem>,
                      <MenuItem key="suggestion" selected={categoryFilter === 'suggestion'} onClick={() => handleFilterSelect('category', 'suggestion')}>Suggestion</MenuItem>,
                      <MenuItem key="report_player" selected={categoryFilter === 'report_player'} onClick={() => handleFilterSelect('category', 'report_player')}>Report Player</MenuItem>,
                      <MenuItem key="technical" selected={categoryFilter === 'technical'} onClick={() => handleFilterSelect('category', 'technical')}>Technical</MenuItem>,
                      <MenuItem key="other" selected={categoryFilter === 'other'} onClick={() => handleFilterSelect('category', 'other')}>Other</MenuItem>,
                    ]}
                    {filterType === 'priority' && [
                      <MenuItem key="all" selected={priorityFilter === ''} onClick={() => handleFilterSelect('priority', '')}>All</MenuItem>,
                      <MenuItem key="low" selected={priorityFilter === 'low'} onClick={() => handleFilterSelect('priority', 'low')}>Low</MenuItem>,
                      <MenuItem key="medium" selected={priorityFilter === 'medium'} onClick={() => handleFilterSelect('priority', 'medium')}>Medium</MenuItem>,
                      <MenuItem key="high" selected={priorityFilter === 'high'} onClick={() => handleFilterSelect('priority', 'high')}>High</MenuItem>,
                      <MenuItem key="very_high" selected={priorityFilter === 'very_high'} onClick={() => handleFilterSelect('priority', 'very_high')}>Very High</MenuItem>,
                    ]}
                    {filterType === 'status' && [
                      <MenuItem key="all" selected={statusFilter === ''} onClick={() => handleFilterSelect('status', '')}>All</MenuItem>,
                      <MenuItem key="open" selected={statusFilter === 'open'} onClick={() => handleFilterSelect('status', 'open')}>Open</MenuItem>,
                      <MenuItem key="in_progress" selected={statusFilter === 'in_progress'} onClick={() => handleFilterSelect('status', 'in_progress')}>In Progress</MenuItem>,
                      <MenuItem key="resolved" selected={statusFilter === 'resolved'} onClick={() => handleFilterSelect('status', 'resolved')}>Resolved</MenuItem>,
                    ]}
                  </Menu>
                  <TableBody>
                    {tickets.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} align="center">No tickets found.</TableCell>
                      </TableRow>
                    )}
                    {tickets
                      .filter(ticket => (categoryFilter === '' || ticket.category === categoryFilter)
                        && (priorityFilter === '' || ticket.priority === priorityFilter)
                        && (statusFilter === '' || ticket.status === statusFilter)
                        && (labelFilter.length === 0 || (ticket.labels && labelFilter.every(l => ticket.labels?.includes(l))))
                        && (assignedToFilter === '' || (ticket.assignedTo && ticket.assignedTo._id === assignedToFilter))
                        && (!searchTicket || ticket.title.toLowerCase().includes(searchTicket.toLowerCase()) || ticket.description.toLowerCase().includes(searchTicket.toLowerCase()))
                      )
                      .map(ticket => (
                        <TableRow
                          key={ticket._id}
                          hover
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                            '&:hover': {
                              bgcolor: '#e3f2fd',
                              transform: 'scale(1.01)',
                              boxShadow: 2,
                            },
                            borderRadius: 2,
                          }}
                          onClick={() => navigate(`/tickets/${ticket._id}`)}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', fontSize: 15 }}>
                                {ticket.assignedTo?.avatar ? <img src={ticket.assignedTo.avatar} alt="avatar" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : (ticket.assignedTo?.username?.[0]?.toUpperCase() || ticket.title[0]?.toUpperCase())}
                              </Avatar>
                              <Typography fontWeight={600} fontSize={15} sx={{ color: 'var(--primary)' }}>{ticket.title}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={ticket.category ? ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1).replace('_', ' ') : '-'} size="small" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 700 }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.priority ? ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1).replace('_', ' ') : '-'}
                              size="small"
                              sx={{
                                bgcolor:
                                  ticket.priority === 'very_high' ? '#ff1744' :
                                    ticket.priority === 'high' ? '#ff9100' :
                                      ticket.priority === 'medium' ? '#2979ff' :
                                        ticket.priority === 'low' ? '#00e676' : '#e3f2fd',
                                color:
                                  ticket.priority === 'low' ? '#222' : '#fff',
                                fontWeight: 700
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={ticket.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                bgcolor:
                                  ticket.status === 'open' ? '#fffde7' :
                                    ticket.status === 'in_progress' ? '#e0f7fa' :
                                      ticket.status === 'resolved' ? '#e3ffe3' : '#f5f7fa',
                                color: '#222',
                                fontWeight: 700,
                                textTransform: 'capitalize',
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <AssignmentIndIcon sx={{ color: '#bdbdbd', fontSize: 18 }} />
                              <Typography fontSize={14}>{ticket.assignedTo ? ticket.assignedTo.username : '-'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarTodayIcon sx={{ color: '#bdbdbd', fontSize: 18 }} />
                              <Typography fontSize={13}>{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : '-'}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center" gap={1}>
                              <ForumIcon sx={{ color: '#bdbdbd', fontSize: 18 }} />
                              <Typography fontSize={14}>{ticket.replies?.length || 0}</Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        )}
        {activeSection === 'logs' && isSuperAdmin && (
          <LogsPage admins={admins} />
        )}
        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>Change Password</DialogTitle>
          <DialogContent>
            <Typography>User: {selectedUser?.username} ({selectedUser?.email})</Typography>
            <TextField
              label="New Password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              fullWidth
              margin="normal"
            />
            {pwChangeMsg && <Alert severity={pwChangeMsg.includes('successfully') ? 'success' : 'error'} sx={{ mt: 1 }}>{pwChangeMsg}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button onClick={handleChangePassword} variant="contained" disabled={!newPassword || newPassword.length < 6}>Save</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={replyDialogOpen} onClose={handleCloseReplyDialog}>
          <DialogTitle>Reply to Ticket</DialogTitle>
          <DialogContent>
            <Typography>Ticket: {selectedTicket?.title}</Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>In-game Nickname: <b>{selectedTicket?.nickname || '-'}</b></Typography>
            {(selectedTicket?.screenshotUrls?.length ?? 0) > 0 && (
              <Box mt={1} display="flex" flexDirection="column" gap={0.5}>
                {selectedTicket?.screenshotUrls?.map((url, i) => (
                  <Typography key={i} variant="body2" color="primary">
                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>Screenshot {selectedTicket.screenshotUrls && selectedTicket.screenshotUrls.length > 1 ? `#${i + 1}` : ''}</a>
                  </Typography>
                ))}
              </Box>
            )}
            <TextField
              label="Reply"
              value={replyMsg}
              onChange={e => setReplyMsg(e.target.value)}
              fullWidth
              margin="normal"
              multiline
              minRows={2}
            />
            {replyStatus && <Alert severity={replyStatus.includes('successfully') ? 'success' : 'error'} sx={{ mt: 1 }}>{replyStatus}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseReplyDialog}>Cancel</Button>
            <Button onClick={handleSendReply} variant="contained" disabled={!replyMsg}>Send</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editDialogOpen} onClose={handleCloseEditDialog}
          PaperProps={{
            sx: {
              boxShadow: '0 8px 40px 8px rgba(63,167,255,0.25)',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(2px)',
              border: '1.5px solid #3fa7ff',
            },
            elevation: 24,
          }}
          BackdropProps={{
            sx: {
              backgroundColor: 'rgba(40,60,100,0.25)',
              backdropFilter: 'blur(6px)',
            }
          }}
        >
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent>
            <TextField label="Username" value={editUsername} onChange={e => setEditUsername(e.target.value)} fullWidth margin="normal" />
            <TextField label="Email" value={editEmail} onChange={e => setEditEmail(e.target.value)} fullWidth margin="normal" />
            {isSuperAdmin && (
              <Select label="Role" value={editRole} onChange={e => setEditRole(e.target.value)} fullWidth sx={{ mt: 2 }}>
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="moderator">Moderator</MenuItem>
              </Select>
            )}
            {editStatus && <Alert severity={editStatus.includes('Successfully') ? 'success' : 'error'} sx={{ mt: 1 }}>{editStatus}</Alert>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseEditDialog}>Cancel</Button>
            <Button onClick={handleEditUser} variant="contained" disabled={!editUsername || !editEmail}>Save</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)}>
          <DialogTitle>Delete User</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this user?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteUserId(null)}>Cancel</Button>
            <Button onClick={() => deleteUserId && handleDeleteUser(deleteUserId)} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={!!deleteTicketId} onClose={() => setDeleteTicketId(null)}>
          <DialogTitle>Delete Ticket</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete this ticket?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteTicketId(null)}>Cancel</Button>
            <Button onClick={() => deleteTicketId && handleDeleteTicket(deleteTicketId)} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={editTicketDialogOpen} onClose={() => setEditTicketDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Edit Ticket</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {editTicketError && <Alert severity="error">{editTicketError}</Alert>}
            <TextField
              label="Title"
              value={editTicketFields.title || ''}
              onChange={e => setEditTicketFields((f: any) => ({ ...f, title: e.target.value }))}
              fullWidth
              required
              margin="normal"
              inputProps={{ minLength: 3, maxLength: 100 }}
            />
            <TextField
              label="Description"
              value={editTicketFields.description || ''}
              onChange={e => setEditTicketFields((f: any) => ({ ...f, description: e.target.value }))}
              fullWidth
              required
              margin="normal"
              multiline
              minRows={3}
              inputProps={{ minLength: 10, maxLength: 1000 }}
            />
            <TextField
              label="In-game Nickname"
              value={editTicketFields.nickname || ''}
              onChange={e => setEditTicketFields((f: any) => ({ ...f, nickname: e.target.value }))}
              fullWidth
              required
              margin="normal"
              inputProps={{ minLength: 2, maxLength: 60 }}
            />
            <Box display="flex" gap={2}>
              <TextField
                select
                label="Category"
                value={editTicketFields.category || 'bug'}
                onChange={e => setEditTicketFields((f: any) => ({ ...f, category: e.target.value }))}
                fullWidth
                required
                SelectProps={{ native: true }}
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
                value={editTicketFields.priority || 'medium'}
                onChange={e => setEditTicketFields((f: any) => ({ ...f, priority: e.target.value }))}
                fullWidth
                required
                SelectProps={{ native: true }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </TextField>
            </Box>
            <TextField
              select
              label="Status"
              value={editTicketFields.status || 'open'}
              onChange={e => setEditTicketFields((f: any) => ({ ...f, status: e.target.value }))}
              fullWidth
              required
              SelectProps={{ native: true }}
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </TextField>
            {(editTicketFields.screenshotUrls || ['']).map((url: string, idx: number) => (
              <Box key={idx} display="flex" alignItems="center" gap={1} mb={1}>
                <TextField
                  label={`Screenshot URL${(editTicketFields.screenshotUrls || []).length > 1 ? ` #${idx + 1}` : ''} (optional)`}
                  value={url}
                  onChange={e => {
                    const newUrls = [...(editTicketFields.screenshotUrls || [])];
                    newUrls[idx] = e.target.value;
                    setEditTicketFields((f: any) => ({ ...f, screenshotUrls: newUrls }));
                  }}
                  fullWidth
                  margin="normal"
                  type="url"
                />
                {idx === (editTicketFields.screenshotUrls || []).length - 1 && (editTicketFields.screenshotUrls || []).length < 10 && (
                  <Button type="button" variant="outlined" sx={{ minWidth: 36, height: 40, px: 0, fontSize: 24, fontWeight: 700 }} onClick={() => setEditTicketFields((f: any) => ({ ...f, screenshotUrls: [...(f.screenshotUrls || []), ''] }))}>+
                  </Button>
                )}
                {idx > 0 && (
                  <Button type="button" variant="outlined" color="error" sx={{ minWidth: 36, height: 40, px: 0, fontSize: 24, fontWeight: 700 }} onClick={() => setEditTicketFields((f: any) => ({ ...f, screenshotUrls: (f.screenshotUrls || []).filter((_: any, i: number) => i !== idx) }))}>-
                  </Button>
                )}
              </Box>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditTicketDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={async () => {
              setEditTicketError('');
              // Validation
              if (!editTicketFields.title || editTicketFields.title.length < 3 || editTicketFields.title.length > 100) {
                setEditTicketError('Title must be between 3 and 100 characters.');
                return;
              }
              if (!editTicketFields.description || editTicketFields.description.length < 10 || editTicketFields.description.length > 1000) {
                setEditTicketError('Description must be between 10 and 1000 characters.');
                return;
              }
              if (!editTicketFields.nickname || editTicketFields.nickname.length < 2 || editTicketFields.nickname.length > 60) {
                setEditTicketError('In-game Nickname must be between 2 and 60 characters.');
                return;
              }
              try {
                const res = await fetch(`/api/admin/tickets/${editTicketFields._id}`, {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({
                    title: editTicketFields.title,
                    description: editTicketFields.description,
                    nickname: editTicketFields.nickname,
                    category: editTicketFields.category,
                    priority: editTicketFields.priority,
                    status: editTicketFields.status,
                    screenshotUrls: (editTicketFields.screenshotUrls || []).filter((url: string) => !!url),
                  })
                });
                const data = await res.json();
                if (!res.ok) {
                  setEditTicketError(data.message || 'Failed to update ticket.');
                } else {
                  setEditTicketDialogOpen(false);
                  setTickets(tickets => tickets.map(t => t._id === data._id ? data : t));
                  toast.success('Ticket updated!');
                }
              } catch {
                setEditTicketError('Server error.');
              }
            }}>Save</Button>
          </DialogActions>
        </Dialog>
        {hasNewTickets && (
          <Box display="flex" justifyContent="center" alignItems="center" my={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setHasNewTickets(false);
                setNewTicketCount(0);
              }}
            >
              {newTicketCount > 20 ? '20+ new tickets' : `${newTicketCount} new ticket${newTicketCount > 1 ? 's' : ''}`} - Show
            </Button>
          </Box>
        )}
      </Box>
      <AdminChat />
    </>
  );
};

// LogsPage component (tüm sistem loglarını detaylı gösterir, sadece superadmin görebilir)
const LogsPage: React.FC<{ admins: User[] }> = ({ admins }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [fromDate, setFromDate] = useState<string | null>(null);
  const [toDate, setToDate] = useState<string | null>(null);

  // Kullanıcı rolünü kontrol et
  let isSuperAdmin = false;
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded: any = jwtDecode(token);
      isSuperAdmin = decoded.role === 'superadmin';
    }
  } catch {}

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (userFilter) params.append('user', userFilter);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      const res = await fetch(`/api/admin/logs?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || 'Failed to fetch logs.');
      else setLogs(data.logs || []);
    } catch {
      setError('Server error.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line
  }, [actionFilter, userFilter, fromDate, toDate]);

  const handleDeleteAllLogs = async () => {
    if (!window.confirm('All logs will be deleted. Are you sure?')) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/admin/logs', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert('All logs have been deleted.');
        fetchLogs();
      } else {
        alert(data.message || 'Delete operation failed.');
      }
    } catch {
      alert('Server error.');
    }
    setDeleting(false);
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh"><Typography>Loading logs...</Typography></Box>;
  if (error) return <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>;

  // Unique actions for filter dropdown
  const uniqueActions = Array.from(new Set(logs.map(l => l.action))).filter(Boolean);

  return (
    <Paper sx={{ p: { xs: 1, md: 4 }, mt: 2, width: '100%', maxWidth: 1200, mx: 'auto', borderRadius: 4 }}>
      <Typography variant="h5" fontWeight={700} mb={3} color="primary">System Logs</Typography>
      {/* Filters */}
      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <TextField
          select
          label="Action"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          SelectProps={{ native: true }}
        >
          <option value=""></option>
          {uniqueActions.map(action => (
            <option key={action} value={action}>{action.replace(/_/g, ' ').toUpperCase()}</option>
          ))}
        </TextField>
        <TextField
          select
          label="User"
          value={userFilter}
          onChange={e => setUserFilter(e.target.value)}
          sx={{ minWidth: 160 }}
          SelectProps={{ native: true }}
        >
          <option value=""></option>
          {admins.map(admin => (
            <option key={admin._id} value={admin._id}>{admin.username} ({admin.role})</option>
          ))}
        </TextField>
        <TextField
          label="From"
          type="date"
          value={fromDate || ''}
          onChange={e => setFromDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="To"
          type="date"
          value={toDate || ''}
          onChange={e => setToDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <Button variant="outlined" onClick={() => { setActionFilter(''); setUserFilter(''); setFromDate(null); setToDate(null); }}>Clear Filters</Button>
      </Box>
      {isSuperAdmin && (
        <Button
          variant="contained"
          color="error"
          onClick={handleDeleteAllLogs}
          sx={{ mb: 2 }}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete All Logs'}
        </Button>
      )}
      {logs.length === 0 ? (
        <Typography color="text.secondary">No logs found.</Typography>
      ) : (
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#e3f2fd' }}>
                <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Action</th>
                <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>User</th>
                <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Role</th>
                <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Date</th>
                <th style={{ padding: 8, textAlign: 'left', fontWeight: 700 }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => {
                // User info
                let userDisplay = '-';
                if (log.user) {
                  if (typeof log.user === 'object') {
                    userDisplay = `${log.user.username || ''} (${log.user.email || log.user._id || ''})`;
                  } else {
                    userDisplay = log.user;
                  }
                }
                // Details rendering
                let ticketId = null;
                let detailsString = '';
                if (log.details) {
                  ticketId = log.details.ticketId || log.details.ticket || log.details.id;
                  try {
                    detailsString = JSON.stringify(log.details, null, 2);
                  } catch {
                    detailsString = String(log.details);
                  }
                }
                return (
                  <tr key={log._id || idx} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: 8 }}>{log.action?.replace(/_/g, ' ').toUpperCase()}</td>
                    <td style={{ padding: 8 }}>{userDisplay}</td>
                    <td style={{ padding: 8 }}>{log.user?.role || (typeof log.user === 'object' ? log.user.role : '-')}</td>
                    <td style={{ padding: 8 }}>
                      {log.date || log.createdAt || log.timestamp
                        ? new Date(log.date || log.createdAt || log.timestamp).toLocaleString()
                        : '-'}
                    </td>
                    <td style={{ padding: 8, fontFamily: 'monospace', fontSize: 13, color: '#555', maxWidth: 400, overflow: 'auto', whiteSpace: 'pre-line' }}>
                      {ticketId ? (
                        <a href={`/tickets/${ticketId}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline', fontWeight: 700 }}>
                          View Ticket
                        </a>
                      ) : (
                        <span title={detailsString.length > 200 ? detailsString : undefined} style={{ display: 'inline-block', maxWidth: 380, overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'top' }}>
                          {detailsString.length > 200 ? detailsString.slice(0, 200) + '...' : detailsString}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Box>
      )}
    </Paper>
  );
};

export default AdminPanel;