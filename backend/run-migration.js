require('dotenv').config();
const { execSync } = require('child_process');

// Debug: Check if .env is loaded
console.log('After dotenv.config():');
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);

// Pass the environment variables to the child process
const env = { ...process.env };
console.log('Child process env.DATABASE_URL:', env.DATABASE_URL);

// Set the environment variable explicitly for the child process
env.DATABASE_URL = process.env.DATABASE_URL;

try {
    execSync('npx typeorm-ts-node-commonjs -d ./data-source.ts migration:run', {
        stdio: 'inherit',
        env: env
    });
} catch (error) {
    console.error('Migration failed with error:', error.message);
    process.exit(1);
}
