const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Charger .env
dotenv.config();

const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function clearPartitions() {
    try {
        await client.connect();
        console.log('--- 🧹 Nettoyage de la base de données (Partitions) ---');

        console.log('1. Vidage des tables dépendantes (favorites, transactions, user_partitions)...');
        await client.query('TRUNCATE TABLE favorites CASCADE;');
        await client.query('TRUNCATE TABLE transactions CASCADE;');
        await client.query('TRUNCATE TABLE user_partitions CASCADE;');

        console.log('2. Suppression de toutes les partitions...');
        await client.query('DELETE FROM partitions;');

        console.log('3. Réinitialisation de la séquence d\'ID...');
        await client.query('ALTER SEQUENCE partitions_id_seq RESTART WITH 1;');

        console.log('\n✅ Succès : La table des partitions est vide et les IDs repartiront de 1.');
    } catch (err) {
        console.error('\n❌ Erreur lors du nettoyage :', err.message);
    } finally {
        await client.end();
    }
}

clearPartitions();
