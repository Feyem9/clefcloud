const { Client } = require('pg');
require('dotenv').config();

async function addIsAdminColumn() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database');

        // Add is_admin column if it doesn't exist
        await client.query(`
      ALTER TABLE "users" 
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
    `);
        console.log('Column is_admin added successfully (or already existed)');

        // Set the specific user as admin if needed
        if (process.env.ADMIN_EMAIL) {
            await client.query(`
        UPDATE "users" 
        SET is_admin = true 
        WHERE email = $1;
      `, [process.env.ADMIN_EMAIL]);
            console.log(`User ${process.env.ADMIN_EMAIL} set as admin`);
        }

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

addIsAdminColumn();
