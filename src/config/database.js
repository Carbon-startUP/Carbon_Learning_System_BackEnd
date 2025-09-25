import pg from 'pg';
import { createClient } from 'redis';
import process from "process";
import dotenv from 'dotenv';

dotenv.config({ silent: true });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
  }
});

pool.on('connect', () => {
  console.log('[+] Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('[-] Unexpected error on idle client', err);
  process.exit(-1);
});

redis.on('connect', () => {
  console.log('[+] Connected to Redis cache');
});

redis.on('error', (err) => {
  console.error('[-] Redis connection error:', err);
});

redis.on('ready', () => {
  console.log('[+] Redis client ready');
});

redis.connect().catch(console.error);

export { redis, pool };