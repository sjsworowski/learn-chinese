import * as dotenv from 'dotenv';
dotenv.config(); // ← THIS LINE is critical

import { DataSource } from 'typeorm';
import { User } from './src/entities/user.entity';
import { Vocabulary } from './src/entities/vocabulary.entity';
import { UserProgress } from './src/entities/user-progress.entity';
import { SessionProgress } from './src/entities/session-progress.entity';
import { TestSession } from './src/entities/test-session.entity';
import { UserActivity } from './src/entities/user-activity.entity';

// Logging to verify
console.log('process.env.DATABASE_URL:', process.env.DATABASE_URL);
console.log('process.env.POSTGRES_HOST', process.env.POSTGRES_HOST);

const isValidDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

export default new DataSource(
    isValidDatabaseUrl
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }, // SSL for Supabase/Cloud
            entities: [
                User,
                Vocabulary,
                UserProgress,
                SessionProgress,
                TestSession,
                UserActivity,
            ],
            migrations: ['src/migrations/*.ts'],
        }
        : {
            type: 'postgres',
            host: process.env.POSTGRES_HOST || 'localhost',
            port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
            username: process.env.POSTGRES_USER || 'postgres',
            password: process.env.POSTGRES_PASSWORD || 'postgres',
            database: process.env.POSTGRES_DB || 'postgres',
            entities: [
                User,
                Vocabulary,
                UserProgress,
                SessionProgress,
                TestSession,
                UserActivity,
            ],
            migrations: ['src/migrations/*.ts'],
            ssl: false, // No SSL for local!
        }
);
