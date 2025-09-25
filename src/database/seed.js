import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { pool } from '../config/database.js';
import process from 'process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Color codes for better logging
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bright: '\x1b[1m',
  gray: '\x1b[90m',
  reset: '\x1b[0m'
};

// Logging helpers
const log = {
  info: (msg) => console.log(`${colors.blue}[i]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[✓]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[⚠]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[✗]${colors.reset} ${msg}`),
  hash: (msg) => console.log(`${colors.gray}  ${msg}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

// Function to generate hash of file content
const generateFileHash = (content) => {
  return crypto.createHash('sha256').update(content).digest('hex');
};

const runSeeds = async () => {
  try {
    log.title('\n[+] Starting database seeding...\n');

    // Create seeds table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seeds (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        content_hash VARCHAR(64) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read seed files
    const seedDir = path.join(__dirname, 'seeds');
    
    // Check if seeds directory exists
    if (!fs.existsSync(seedDir)) {
      log.warning('Seeds directory does not exist. Creating it...');
      fs.mkdirSync(seedDir, { recursive: true });
      log.info('Seeds directory created. Please add seed files and run again.');
      return;
    }

    const files = fs.readdirSync(seedDir).sort();

    if (files.length === 0) {
      log.warning('No seed files found in the seeds directory.');
      return;
    }

    for (const file of files) {
      if (file.endsWith('.sql')) {
        const seedSQL = fs.readFileSync(
          path.join(seedDir, file),
          'utf8'
        );
        const currentHash = generateFileHash(seedSQL);

        // Check if seed already ran and get its hash
        const result = await pool.query(
          'SELECT * FROM seeds WHERE filename = $1',
          [file]
        );

        if (result.rows.length === 0) {
          // New seed - run it
          log.info(`Running new seed: ${colors.bright}${file}${colors.reset}`);
          
          await pool.query('BEGIN');
          try {
            await pool.query(seedSQL);
            await pool.query(
              'INSERT INTO seeds (filename, content_hash) VALUES ($1, $2)',
              [file, currentHash]
            );
            await pool.query('COMMIT');
            log.success(`Seed ${colors.bright}${file}${colors.reset} completed`);
          } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
          }
        } else {
          const existingHash = result.rows[0].content_hash;
          
          if (existingHash !== currentHash) {
            // Seed content changed - re-run it
            log.warning(`Seed ${colors.bright}${file}${colors.reset} content changed, re-running...`);
            log.hash(`Old hash: ${existingHash}`);
            log.hash(`New hash: ${currentHash}`);
            
            await pool.query('BEGIN');
            try {
              await pool.query(seedSQL);
              await pool.query(
                'UPDATE seeds SET content_hash = $1, executed_at = CURRENT_TIMESTAMP WHERE filename = $2',
                [currentHash, file]
              );
              await pool.query('COMMIT');
              log.success(`Seed ${colors.bright}${file}${colors.reset} re-executed`);
            } catch (error) {
              await pool.query('ROLLBACK');
              throw error;
            }
          } else {
            log.info(`Seed ${colors.bright}${file}${colors.reset} already executed (unchanged)`);
          }
        }
      }
    }

    log.title('\n[+] Database seeding completed successfully!\n');

  } catch (error) {
    log.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSeeds();
}

export default runSeeds;