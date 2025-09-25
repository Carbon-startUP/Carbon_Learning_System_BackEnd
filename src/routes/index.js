import { Router } from 'express';
import authRoutes from './authRoutes.js';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'Carbon Learning System API',
    version: '1.0.0'
  });
});

// Auth routes
router.use('/auth', authRoutes);

export default router;
