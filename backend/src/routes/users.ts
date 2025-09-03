import express from 'express';
import { requireAdmin } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/', requireAdmin, (req, res) => {
  res.json({ success: true, message: 'Users endpoint - coming soon' });
});

export default router;