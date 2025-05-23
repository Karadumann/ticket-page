import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, CircularProgress, Alert, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { AdminHeader } from './AdminPanel';
import Avatar from '@mui/material/Avatar';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DoneAllIcon from '@mui/icons-material/DoneAll';

const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const decoded: any = jwtDecode(token);
          setIsSuperAdmin(decoded.role === 'superadmin');
        }
        const [summaryRes, trendRes] = await Promise.all([
          fetch('/api/admin/analytics/summary', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/admin/analytics/weekly-trend', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        const summaryData = await summaryRes.json();
        const trendData = await trendRes.json();
        if (!summaryRes.ok) throw new Error(summaryData.message || 'Summary fetch error');
        if (!trendRes.ok) throw new Error(trendData.message || 'Trend fetch error');
        setSummary(summaryData);
        setTrend(trendData.trend);
      } catch (err: any) {
        setError(err.message || 'Server error');
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleSectionChange = (section: 'dashboard' | 'users' | 'tickets' | 'logs') => {
    if (section === 'dashboard') navigate('/dashboard');
    else if (section === 'users') navigate('/admin?section=users');
    else if (section === 'tickets') navigate('/admin?section=tickets');
    else if (section === 'logs') navigate('/admin?section=logs');
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ my: 4 }}>{error}</Alert>;
  if (!summary) return null;

  let adminName = '';
  let adminAvatar = '';
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded: any = jwtDecode(token);
      adminName = decoded.username || decoded.email || 'Admin';
      adminAvatar = decoded.avatar || '';
    } catch {}
  }

  return (
    <>
      <AdminHeader activeSection="dashboard" onSectionChange={handleSectionChange} isSuperAdmin={isSuperAdmin} />
      <Box sx={{ width: '100%', maxWidth: 1400, mx: 'auto', py: 4, px: { xs: 1, md: 4 }, pt: { xs: 8, md: 10 } }}>
        {/* Welcome and avatar */}
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar src={adminAvatar} sx={{ width: 56, height: 56, bgcolor: '#1976d2' }}>
            {adminAvatar ? '' : <PersonIcon fontSize="large" />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary">Welcome, {adminName}!</Typography>
            <Typography variant="body2" color="text.secondary">Here is your admin dashboard overview.</Typography>
          </Box>
        </Box>
        {/* Stat bar with icons and colors */}
        <Grid container spacing={2} mb={4}>
          <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e3f2fd', boxShadow: 2 }}>
              <AssignmentIcon sx={{ color: '#1976d2', fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Total Tickets</Typography>
              <Typography variant="h5" fontWeight={700}>{summary.total}</Typography>
            </Paper>
          </Grid>
          <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9', boxShadow: 2 }}>
              <CheckCircleIcon sx={{ color: '#43a047', fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Solved Tickets</Typography>
              <Typography variant="h5" fontWeight={700}>{summary.resolved}</Typography>
            </Paper>
          </Grid>
          <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fffde7', boxShadow: 2 }}>
              <AccessTimeIcon sx={{ color: '#fbc02d', fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Avg. Resolution Time</Typography>
              <Typography variant="h5" fontWeight={700}>{summary.avgResolution} hours</Typography>
            </Paper>
          </Grid>
          <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
            <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f3e5f5', boxShadow: 2 }}>
              <EmojiEventsIcon sx={{ color: '#8e24aa', fontSize: 32, mb: 1 }} />
              <Typography variant="subtitle2" color="text.secondary">Top Admin</Typography>
              <Typography variant="h6" fontWeight={700}>{summary.topAdmins?.[0]?.name || '-'}</Typography>
              <Typography variant="body2">{summary.topAdmins?.[0]?.count || 0} ticket</Typography>
            </Paper>
          </Grid>
          {/* Extra: Open, Pending, Closed tickets if available */}
          {summary.open !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '33.33%', md: '16.66%' } }}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#e3f2fd', boxShadow: 1 }}>
                <FolderOpenIcon sx={{ color: '#1976d2', fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" color="text.secondary">Open</Typography>
                <Typography variant="h6" fontWeight={700}>{summary.open}</Typography>
              </Paper>
            </Grid>
          )}
          {summary.pending !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '33.33%', md: '16.66%' } }}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fffde7', boxShadow: 1 }}>
                <HourglassEmptyIcon sx={{ color: '#fbc02d', fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" color="text.secondary">Pending</Typography>
                <Typography variant="h6" fontWeight={700}>{summary.pending}</Typography>
              </Paper>
            </Grid>
          )}
          {summary.closed !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '33.33%', md: '16.66%' } }}>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: '#fbe9e7', boxShadow: 1 }}>
                <DoneAllIcon sx={{ color: '#d84315', fontSize: 28, mb: 0.5 }} />
                <Typography variant="subtitle2" color="text.secondary">Closed</Typography>
                <Typography variant="h6" fontWeight={700}>{summary.closed}</Typography>
              </Paper>
            </Grid>
          )}
          {/* Extra: Last 24h, Online Admins, Top Category, Satisfaction Score */}
          {summary.last24h !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e1f5fe', boxShadow: 2 }}>
                <AccessTimeIcon sx={{ color: '#0288d1', fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Tickets (24h)</Typography>
                <Typography variant="h5" fontWeight={700}>{summary.last24h}</Typography>
              </Paper>
            </Grid>
          )}
          {summary.onlineAdmins !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#e8f5e9', boxShadow: 2 }}>
                <PersonIcon sx={{ color: '#388e3c', fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Online Admins</Typography>
                <Typography variant="h5" fontWeight={700}>{summary.onlineAdmins}</Typography>
              </Paper>
            </Grid>
          )}
          {summary.topCategory !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#fff3e0', boxShadow: 2 }}>
                <FolderOpenIcon sx={{ color: '#ff9800', fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Top Category</Typography>
                <Typography variant="h6" fontWeight={700}>{summary.topCategory}</Typography>
              </Paper>
            </Grid>
          )}
          {summary.satisfactionScore !== undefined && (
            <Grid sx={{ width: { xs: '100%', sm: '50%', md: '25%' } }}>
              <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#f3e5f5', boxShadow: 2 }}>
                <EmojiEventsIcon sx={{ color: '#8e24aa', fontSize: 32, mb: 1 }} />
                <Typography variant="subtitle2" color="text.secondary">Satisfaction</Typography>
                <Typography variant="h5" fontWeight={700}>{summary.satisfactionScore} / 5</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
        <Grid container spacing={4}>
          <Grid sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Weekly Ticket Trend</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={trend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="tickets" stroke="#1976d2" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid sx={{ width: '100%' }}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={2}>Tickets per Admin</Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summary.topAdmins || []} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#43a047" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </>
  );
};

export default Dashboard; 