import React, { useEffect, useState } from 'react';
import { Link, Routes, Route } from 'react-router-dom';
import axios from 'axios';

function UsersAdmin() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/admin/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data);
    } catch (err) {
      setError('Could not fetch users');
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/admin/roles', { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data);
    } catch (err) {
      setError('Could not fetch roles');
    }
  };

  const handleRoleChange = async (userId, roleId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/admin/users/${userId}/role`, { role_id: roleId }, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) {
      setError('Could not update role');
    }
  };

  const handleDelete = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchUsers();
    } catch (err) {
      setError('Could not delete user');
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Users</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <table className="w-full mb-4 border">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Email</th>
            <th className="p-2">Display Name</th>
            <th className="p-2">Role</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map(user => (
            <tr key={user.id} className="border-t">
              <td className="p-2">{user.email}</td>
              <td className="p-2">{user.display_name}</td>
              <td className="p-2">
                <select value={user.role_id || ''} onChange={e => handleRoleChange(user.id, e.target.value)} className="border rounded p-1">
                  <option value="">Select</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </td>
              <td className="p-2">
                <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RolesAdmin() {
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => { fetchRoles(); }, []);
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/admin/roles', { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data);
    } catch (err) {
      setError('Could not fetch roles');
    }
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Roles</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ul className="mb-4">
        {roles.map(role => (
          <li key={role.id} className="border-b py-1">{role.name} - {role.description}</li>
        ))}
      </ul>
    </div>
  );
}

function AutomationAdmin() {
  const [rules, setRules] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  useEffect(() => { fetchRules(); }, []);
  const fetchRules = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/admin/automation', { headers: { Authorization: `Bearer ${token}` } });
      setRules(res.data);
    } catch (err) {
      setError('Could not fetch automation rules');
    }
  };
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/admin/automation', { name, conditions: {}, actions: {} }, { headers: { Authorization: `Bearer ${token}` } });
      setName('');
      fetchRules();
    } catch (err) {
      setError('Could not create rule');
    }
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Automation Rules</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <form onSubmit={handleCreate} className="mb-4 flex gap-2">
        <input type="text" placeholder="Rule name" value={name} onChange={e => setName(e.target.value)} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add</button>
      </form>
      <ul>
        {rules.map(rule => (
          <li key={rule.id} className="border-b py-1">{rule.name} {rule.enabled ? '' : '(disabled)'}</li>
        ))}
      </ul>
    </div>
  );
}

function ExportAdmin() {
  const [error, setError] = useState('');
  const handleExport = async () => {
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/admin/export/tickets', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'tickets.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Could not export tickets');
    }
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Export</h2>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded">Export Tickets as CSV</button>
    </div>
  );
}

function AdminPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
      <nav className="mb-4 flex gap-4">
        <Link to="users" className="text-blue-600">Users</Link>
        <Link to="roles" className="text-blue-600">Roles</Link>
        <Link to="automation" className="text-blue-600">Automation</Link>
        <Link to="export" className="text-blue-600">Export</Link>
      </nav>
      <Routes>
        <Route path="users" element={<UsersAdmin />} />
        <Route path="roles" element={<RolesAdmin />} />
        <Route path="automation" element={<AutomationAdmin />} />
        <Route path="export" element={<ExportAdmin />} />
      </Routes>
    </div>
  );
}

export default AdminPage; 