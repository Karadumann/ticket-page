import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Log from '../models/Log';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'Registration successful.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getAllUsers = async (req: any, res: any) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      User.find({}, '-password').skip(skip).limit(limit),
      User.countDocuments()
    ]);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
};

export const changeUserPassword = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.findByIdAndUpdate(id, { password: hashedPassword });
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Password change failed.' });
  }
};

export const updateUser = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { username, email, role } = req.body;
    if (role && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can change user roles.' });
    }
    const update: any = {};
    if (username) update.username = username;
    if (email) update.email = email;
    if (role) update.role = role;
    const user = await User.findByIdAndUpdate(id, update, { new: true, select: '-password' });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Log.create({
      user: req.user.id,
      action: 'update_user',
      targetType: 'user',
      targetId: id,
      details: update,
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'User update failed.' });
  }
};

export const deleteUser = async (req: any, res: any) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only superadmin can delete users.' });
    }
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    await Log.create({
      user: req.user.id,
      action: 'delete_user',
      targetType: 'user',
      targetId: id,
      details: { username: user.username, email: user.email, role: user.role },
    });
    res.json({ message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'User deletion failed.' });
  }
}; 