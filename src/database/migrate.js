import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[ℹ]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[⚠]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  hash: (msg) => console.log(`${colors.gray}${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

const generateFileHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const runMigrations = async () => {
  try {
    log.title('[+] Starting database migrations...\n');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        content_hash VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read migration files
    const migrationDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const migrationSQL = fs.readFileSync(
          path.join(migrationDir, file),
          'utf8'
        );
        const currentHash = generateFileHash(migrationSQL);

        // Check if migration already ran and get its hash
        const result = await pool.query(
          'SELECT * FROM migrations WHERE filename = $1',
          [file]
        );

        if (result.rows.length === 0) {
          // New migration - run it
          log.info(`Running new migration: ${colors.bright}${file}${colors.reset}`);
          
          await pool.query('BEGIN');
          try {
            await pool.query(migrationSQL);
            await pool.query(
              'INSERT INTO migrations (filename, content_hash) VALUES ($1, $2)',
              [file, currentHash]
            );
            await pool.query('COMMIT');
            log.success(`Migration ${colors.bright}${file}${colors.reset} completed`);
          } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
          }
        } else {
          const existingHash = result.rows[0].content_hash;
          
          if (existingHash !== currentHash) {
            // Migration content changed - re-run it
            log.warning(`Migration ${colors.bright}${file}${colors.reset} content changed, re-running...`);
            log.hash(`Old hash: ${existingHash}`);
            log.hash(`New hash: ${currentHash}`);
            
            await pool.query('BEGIN');
            try {
              await pool.query(migrationSQL);
              await pool.query(
                'UPDATE migrations SET content_hash = $1, executed_at = CURRENT_TIMESTAMP WHERE filename = $2',
                [currentHash, file]
              );
              await pool.query('COMMIT');
              log.success(`Migration ${colors.bright}${file}${colors.reset} re-executed successfully`);
            } catch (error) {
              await pool.query('ROLLBACK');
              throw error;
            }
          } else {
            log.success(`Migration ${colors.bright}${file}${colors.reset} ${colors.gray}(already executed - hash matches)${colors.reset}`);
          }
        }
      }
    }

    log.title('\n[+] All migrations completed successfully!');
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrations();