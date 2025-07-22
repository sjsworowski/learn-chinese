require('dotenv').config();
const { execSync } = require('child_process');
const path = require('path');

console.log('After dotenv.config():');
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);

const env = { ...process.env };

console.log('Child process env.DATABASE_URL:', env.DATABASE_URL);

const dataSourcePath = path.resolve(__dirname, 'data-source.ts');

try {
  execSync(`npx typeorm-ts-node-commonjs -d ${dataSourcePath} migration:run`, {
    stdio: 'inherit',
    env,
  });
} catch (error) {
  console.error('Migration failed with error:', error);
  process.exit(1);
}
