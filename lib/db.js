
import { Pool } from 'pg';

// This check ensures that in a development environment, where the module code might be re-executed,
// we don't end up with multiple connection pools.
const globalForDb = globalThis;

// If a pool doesn't already exist, create one.
const pool = globalForDb.pool || new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// In a non-production environment, attach the pool to the global object.
if (process.env.NODE_ENV !== 'production') {
  globalForDb.pool = pool;
}

export default pool;
