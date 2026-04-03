const { Client } = require('pg');
require('dotenv').config();

async function addProfileColumns() {
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

        // Add title and avatar_url columns if they don't exist
        console.log('Adding title column...');
        await client.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS title VARCHAR(255);
        `);

        console.log('Adding avatar_url column (if missing)...');
        await client.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS avatar_url TEXT;
        `);

        console.log('Columns added successfully');

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

addProfileColumns();
