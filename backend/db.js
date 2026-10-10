import pg from 'pg';
import 'dotenv/config';

const isTest = process.env.NODE_ENV === 'test';
const connectionString = isTest
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(`${isTest ? 'TEST_DATABASE_URL' : 'DATABASE_URL'} is not set`);
}

export const pool = new pg.Pool({ connectionString });