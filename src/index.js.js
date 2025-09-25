import app from './app.js';
import { pool, redis } from './config/database.js';
import process from 'process';

const PORT = process.env.PORT || 3000;
// Test database connection
const testConnection = async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[+] Database connected successfully');
  } catch (error) {
    console.error('[-] Database connection failed:', error.message);
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await testConnection();
  
  app.listen(PORT, () => {
    console.log(`[+] Server running on http://localhost:${PORT}`);
    console.log(`[+] Environment: ${process.env.NODE_ENV}`);
  });
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[+] SIGTERM received, shutting down gracefully');
  await pool.end();
  await redis.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[+] SIGINT received, shutting down gracefully');
  await pool.end();
  await redis.close();
  process.exit(0);
});

startServer().catch(console.error);
