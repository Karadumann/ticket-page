import { Request, Response } from 'express';
import Log from '../models/Log';
import User from '../models/User';

export const getLogs = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    // Filtreler
    const filter: any = {};
    if (req.query.action) filter.action = req.query.action;
    if (req.query.user) filter.user = req.query.user;
    if (req.query.targetType) filter.targetType = req.query.targetType;
    if (req.query.from || req.query.to) {
      filter.timestamp = {};
      if (req.query.from) filter.timestamp.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.timestamp.$lte = new Date(req.query.to as string);
    }

    const [logs, total] = await Promise.all([
      Log.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'username email role'),
      Log.countDocuments(filter)
    ]);
    res.json({ logs, total });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs.' });
  }
};

export const deleteAllLogs = async (req: Request, res: Response) => {
  try {
    await Log.deleteMany({});
    res.json({ message: 'All logs deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete logs.' });
  }
}; 