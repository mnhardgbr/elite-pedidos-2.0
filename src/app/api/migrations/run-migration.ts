import { sql } from '@vercel/postgres';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function runMigration() {
  try {
    // Check if we have the database connection string
    if (!process.env.POSTGRES_URL) {
      throw new Error('Database connection string not found. Please check your .env file.');
    }

    const migrationSQL = fs.readFileSync(
      path.join(process.cwd(), 'src', 'app', 'api', 'migrations', 'add_product_fields.sql'),
      'utf8'
    );

    await sql.query(migrationSQL);
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration(); 