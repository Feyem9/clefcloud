require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
    const client = new Client({
        host: process.env.RDS_ENDPOINT.split(':')[0],
        port: parseInt(process.env.RDS_ENDPOINT.split(':')[1]) || 5432,
        database: process.env.DB_NAME,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔌 Tentative de connexion à la base de données...');
        console.log(`Host: ${process.env.RDS_ENDPOINT.split(':')[0]}`);
        console.log(`Database: ${process.env.DB_NAME}`);
        console.log(`User: ${process.env.DB_USERNAME}`);
        
        await client.connect();
        console.log('✅ Connexion réussie !');
        
        const res = await client.query('SELECT NOW()');
        console.log('⏰ Heure du serveur:', res.rows[0].now);
        
        await client.end();
        console.log('👋 Connexion fermée');
    } catch (err) {
        console.error('❌ Erreur de connexion:', err.message);
        console.error('Code d\'erreur:', err.code);
        
        if (err.code === 'ENOTFOUND') {
            console.log('\n💡 Le serveur est introuvable. Vérifiez:');
            console.log('   - L\'endpoint RDS est correct');
            console.log('   - Votre connexion internet');
        } else if (err.code === 'ETIMEDOUT' || err.code === 'ECONNREFUSED') {
            console.log('\n💡 Impossible de se connecter. Vérifiez:');
            console.log('   - Les Security Groups de RDS autorisent votre IP');
            console.log('   - L\'instance RDS est "Publicly accessible"');
            console.log('   - L\'instance RDS est démarrée');
        } else if (err.code === '28P01') {
            console.log('\n💡 Erreur d\'authentification. Vérifiez:');
            console.log('   - Le nom d\'utilisateur est correct');
            console.log('   - Le mot de passe est correct');
        }
    }
}

testConnection();
