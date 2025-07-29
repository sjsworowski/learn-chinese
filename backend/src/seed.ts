import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Vocabulary } from './entities/vocabulary.entity';
import { UserProgress } from './entities/user-progress.entity';
import { SessionProgress } from './entities/session-progress.entity';
import { TestSession } from './entities/test-session.entity';
import { UserActivity } from './entities/user-activity.entity';
import { seedDatabaseIfNeeded } from './seed-util';
import * as fs from 'fs';
import * as path from 'path';

const isValidDatabaseUrl = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');

const dataSource = new DataSource(
    isValidDatabaseUrl
        ? {
            type: 'postgres',
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
            entities: [
                User,
                Vocabulary,
                UserProgress,
                SessionProgress,
                TestSession,
                UserActivity,
            ],
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
        }
);

async function main() {
    await dataSource.initialize();
    await seedDatabaseIfNeeded(dataSource);
    await dataSource.destroy();
}

main().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
}); 