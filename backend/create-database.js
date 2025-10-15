require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
    // Connect to default 'postgres' database first
    const client = new Client({
        host: process.env.RDS_ENDPOINT.split(':')[0],
        port: parseInt(process.env.RDS_ENDPOINT.split(':')[1]) || 5432,
        database: 'postgres', // Connect to default database
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Connexion à la base de données par défaut...');
        await client.connect();
        console.log('✅ Connecté !');

        // Check if database exists
        const checkDb = await client.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            [process.env.DB_NAME]
        );

        if (checkDb.rows.length > 0) {
            console.log(`ℹ️  La base de données "${process.env.DB_NAME}" existe déjà.`);
        } else {
            console.log(`📦 Création de la base de données "${process.env.DB_NAME}"...`);
            await client.query(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log('✅ Base de données créée avec succès !');
        }

        await client.end();
        console.log('👋 Connexion fermée');
    } catch (err) {
        console.error('❌ Erreur:', err.message);
        console.error('Code d\'erreur:', err.code);
    }
}

createDatabase();
