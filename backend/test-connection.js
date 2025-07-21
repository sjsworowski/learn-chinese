require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
    console.log('Testing Supabase connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);

    // Try DATABASE_URL first, then fall back to individual parameters
    const connectionConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            host: process.env.POSTGRES_HOST,
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DB,
            ssl: { rejectUnauthorized: false }
        };

    const client = new Client(connectionConfig);

    try {
        await client.connect();
        console.log('✅ Successfully connected to Supabase!');

        const result = await client.query('SELECT NOW()');
        console.log('Current database time:', result.rows[0].now);

        await client.end();
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        console.error('Connection config used:', connectionConfig);
        process.exit(1);
    }
}

testConnection(); 